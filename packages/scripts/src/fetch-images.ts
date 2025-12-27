#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import * as Minio from "minio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
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
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({
		accelerateUrl: env.DATABASE_URL ?? "",
	});

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const minioClient = new Minio.Client({
		endPoint: env.MINIO_HOST ?? "",
		port: Number(env.MINIO_PORT),
		useSSL: true,
		accessKey: env.MINIO_ACCESS_KEY ?? "",
		secretKey: env.MINIO_SECRET_KEY ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	async function fetchImages() {
		const images = await prisma.image.findMany({
			where: { userId, status: UNEXPORTED },
		});
		console.log(`📊 取得した画像データ数: ${images.length}。`);

		const outputDir = path.join(__dirname, "../image/dump");
		await mkdir(outputDir, { recursive: true });

		const downloadPromises = images.map(async (image: { path: string }) => {
			const { path: imagePath } = image;
			const filePath = path.join(outputDir, imagePath);

			await mkdir(path.dirname(filePath), { recursive: true });
			await minioClient.fGetObject(
				env.MINIO_BUCKET_NAME ?? "",
				`images/original/${imagePath}`,
				filePath,
			);
		});

		await Promise.all(downloadPromises);
		console.log("💾 すべての画像の保存が完了しました。");
	}

	try {
		await fetchImages();
		await notificationService.notifyInfo("fetch-images completed", {
			caller: "fetch-images",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`fetch-images failed: ${error}`, {
			caller: "fetch-images",
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
