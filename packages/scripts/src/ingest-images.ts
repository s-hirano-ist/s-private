#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import {
	makeExportedStatus,
	makeId,
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { glob } from "glob";
import * as Minio from "minio";
import sharp from "sharp";

const SCRIPT_NAME = "ingest-images";

const ORIGINAL_IMAGE_PATH = "images/original";
const THUMBNAIL_IMAGE_PATH = "images/thumbnail";
const THUMBNAIL_SIZE = 192;

function getContentType(filePath: string): string | null {
	const ext = extname(filePath).toLowerCase();
	switch (ext) {
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".png":
			return "image/png";
		case ".gif":
			return "image/gif";
		case ".webp":
			return "image/webp";
		default:
			return null;
	}
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");

	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
		MINIO_HOST: process.env.MINIO_HOST,
		MINIO_PORT: process.env.MINIO_PORT,
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
		MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
		MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
		MINIO_USE_SSL: process.env.MINIO_USE_SSL,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const minioClient = new Minio.Client({
		endPoint: env.MINIO_HOST ?? "",
		port: Number(env.MINIO_PORT),
		useSSL: env.MINIO_USE_SSL === "true",
		accessKey: env.MINIO_ACCESS_KEY ?? "",
		secretKey: env.MINIO_SECRET_KEY ?? "",
	});

	const bucketName = env.MINIO_BUCKET_NAME ?? "";

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const exported = makeExportedStatus();

	const filePaths = new Set<string>();

	async function ingestImages() {
		const files = await glob(`${contentsPath}/image/dump/*`);
		const imageFiles = files.filter((f) => getContentType(f) !== null);
		console.log(`📁 ${imageFiles.length} 件の画像ファイルを検出しました。`);

		const existingImages = await prisma.image.findMany({
			where: { userId },
			select: { id: true, path: true },
		});
		const existingImagesMap = new Map(
			existingImages.map((i: { id: string; path: string }) => [i.path, i]),
		);
		console.log(`📊 DB に ${existingImagesMap.size} 件の既存画像があります。`);

		let insertedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const filePath of imageFiles) {
			const imagePath = basename(filePath);
			filePaths.add(imagePath);

			try {
				if (existingImagesMap.has(imagePath)) {
					skippedCount++;
					continue;
				}

				const buffer = await readFile(filePath);
				const fileStat = await stat(filePath);
				const metadata = await sharp(buffer).metadata();
				const contentType = getContentType(filePath);

				if (!contentType) {
					console.log(`⏭️  スキップ（未対応形式）: ${imagePath}`);
					skippedCount++;
					continue;
				}

				if (dryRun) {
					console.log(`🔍 [dry-run] 挿入予定: ${imagePath}`);
					insertedCount++;
					continue;
				}

				// Upload original to MinIO if not exists
				const originalKey = `${ORIGINAL_IMAGE_PATH}/${imagePath}`;
				try {
					await minioClient.statObject(bucketName, originalKey);
					console.log(`📦 MinIO に既存（original）: ${imagePath}`);
				} catch {
					await minioClient.putObject(bucketName, originalKey, buffer);
					console.log(`📤 MinIO アップロード（original）: ${imagePath}`);
				}

				// Generate and upload thumbnail
				const thumbnailBuffer = await sharp(buffer)
					.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
					.toBuffer();
				const thumbnailKey = `${THUMBNAIL_IMAGE_PATH}/${imagePath}`;
				await minioClient.putObject(bucketName, thumbnailKey, thumbnailBuffer);
				console.log(`📤 MinIO アップロード（thumbnail）: ${imagePath}`);

				// Create DB record
				await prisma.image.create({
					data: {
						id: String(makeId()),
						path: imagePath,
						contentType,
						fileSize: fileStat.size,
						width: metadata.width ?? null,
						height: metadata.height ?? null,
						status: exported.status,
						exportedAt: exported.exportedAt,
						userId,
						createdAt: new Date(),
					},
				});
				insertedCount++;
				console.log(`✅ 挿入: ${imagePath}`);
			} catch (error) {
				console.error(`❌ エラー（${imagePath}）:`, error);
				errorCount++;
			}
		}

		return { insertedCount, skippedCount, errorCount };
	}

	async function purgeImages(): Promise<number> {
		const exportedImages = await prisma.image.findMany({
			where: { userId, status: exported.status },
			select: { id: true, path: true },
		});

		const toDelete = exportedImages.filter(
			(i: { id: string; path: string }) => !filePaths.has(i.path),
		);

		if (toDelete.length === 0) {
			console.log("🗑️  削除対象なし");
			return 0;
		}

		let deletedCount = 0;
		for (const image of toDelete) {
			try {
				if (dryRun) {
					console.log(`🗑️  [dry-run] 削除予定: ${image.path}`);
				} else {
					await prisma.image.delete({ where: { id: image.id } });
					await minioClient.removeObject(
						bucketName,
						`${ORIGINAL_IMAGE_PATH}/${image.path}`,
					);
					await minioClient.removeObject(
						bucketName,
						`${THUMBNAIL_IMAGE_PATH}/${image.path}`,
					);
					console.log(`🗑️  削除: ${image.path}`);
				}
				deletedCount++;
			} catch (error) {
				console.error(`❌ 削除エラー（${image.path}）:`, error);
			}
		}

		return deletedCount;
	}

	try {
		const { insertedCount, skippedCount, errorCount } = await ingestImages();
		const deletedCount = await purgeImages();
		console.log(
			`\n📊 結果: 挿入 ${insertedCount} 件, スキップ ${skippedCount} 件, 削除 ${deletedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
		);
		await notificationService.notifyInfo(`${SCRIPT_NAME} completed`, {
			caller: SCRIPT_NAME,
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`${SCRIPT_NAME} failed: ${error}`, {
			caller: SCRIPT_NAME,
		});
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
