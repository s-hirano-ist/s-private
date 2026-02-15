#!/usr/bin/env node
import { basename, extname } from "node:path";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { glob } from "glob";
import * as Minio from "minio";
import { createCfAccessTransport } from "./minio-transport.ts";

const SCRIPT_NAME = "cleanup-minio-images";

const ORIGINAL_IMAGE_PATH = "images/original";
const THUMBNAIL_IMAGE_PATH = "images/thumbnail";

function isImageFile(filePath: string): boolean {
	const ext = extname(filePath).toLowerCase();
	return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
}

function listObjects(
	client: Minio.Client,
	bucket: string,
	prefix: string,
): Promise<string[]> {
	return new Promise((resolve, reject) => {
		const keys: string[] = [];
		const stream = client.listObjectsV2(bucket, prefix, true);
		stream.on("data", (obj) => {
			if (obj.name) keys.push(obj.name);
		});
		stream.on("end", () => resolve(keys));
		stream.on("error", reject);
	});
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");

	const env = {
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		MINIO_HOST: process.env.MINIO_HOST,
		MINIO_PORT: process.env.MINIO_PORT,
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
		MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
		MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const contentsPath = process.env.S_CONTENTS_PATH ?? process.cwd();

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const transport = createCfAccessTransport();
	const minioClient = new Minio.Client({
		endPoint: env.MINIO_HOST ?? "",
		port: Number(env.MINIO_PORT),
		useSSL: true,
		accessKey: env.MINIO_ACCESS_KEY ?? "",
		secretKey: env.MINIO_SECRET_KEY ?? "",
		...(transport && { transport }),
	});

	const bucketName = env.MINIO_BUCKET_NAME ?? "";

	try {
		// 1. ローカルファイル一覧取得
		const localFiles = await glob(`${contentsPath}/image/dump/*`);
		const localFileNames = new Set(
			localFiles.filter(isImageFile).map((f) => basename(f)),
		);
		console.log(
			`📁 ローカルに ${localFileNames.size} 件の画像ファイルを検出しました。`,
		);

		// 2. MinIOオブジェクト一覧取得
		const [originalKeys, thumbnailKeys] = await Promise.all([
			listObjects(minioClient, bucketName, `${ORIGINAL_IMAGE_PATH}/`),
			listObjects(minioClient, bucketName, `${THUMBNAIL_IMAGE_PATH}/`),
		]);
		console.log(
			`📦 MinIO: original ${originalKeys.length} 件, thumbnail ${thumbnailKeys.length} 件`,
		);

		// 3. 差分検出
		const orphanedOriginals = originalKeys.filter(
			(key) => !localFileNames.has(basename(key)),
		);
		const orphanedThumbnails = thumbnailKeys.filter(
			(key) => !localFileNames.has(basename(key)),
		);

		const totalOrphaned = orphanedOriginals.length + orphanedThumbnails.length;
		if (totalOrphaned === 0) {
			console.log("✅ 孤立ファイルなし");
			await notificationService.notifyInfo(
				`${SCRIPT_NAME} completed: no orphaned files`,
				{ caller: SCRIPT_NAME },
			);
			return;
		}

		console.log(
			`🗑️  孤立ファイル検出: original ${orphanedOriginals.length} 件, thumbnail ${orphanedThumbnails.length} 件`,
		);

		// 4. 削除実行
		let deletedCount = 0;
		let errorCount = 0;

		for (const key of [...orphanedOriginals, ...orphanedThumbnails]) {
			try {
				if (dryRun) {
					console.log(`🔍 [dry-run] 削除予定: ${key}`);
				} else {
					await minioClient.removeObject(bucketName, key);
					console.log(`🗑️  削除: ${key}`);
				}
				deletedCount++;
			} catch (error) {
				console.error(`❌ 削除エラー（${key}）:`, error);
				errorCount++;
			}
		}

		console.log(
			`\n📊 結果: 削除 ${deletedCount} 件, エラー ${errorCount} 件${dryRun ? " (dry-run)" : ""}`,
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
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
