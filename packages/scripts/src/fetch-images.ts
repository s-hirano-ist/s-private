#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createMinioClient } from "@s-hirano-ist/s-storage";

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
		MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	if (process.env.MINIO_USE_SSL === "true") {
		if (
			!process.env.CF_ACCESS_CLIENT_ID ||
			!process.env.CF_ACCESS_CLIENT_SECRET
		) {
			throw new Error(
				"CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are required when MINIO_USE_SSL is true.",
			);
		}
	}

	// Dynamic import for Prisma ESM compatibility
	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const minioClient = createMinioClient();

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

	async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				if (attempt === retries - 1) throw error;
				const delay = 1000 * 2 ** attempt;
				console.warn(`⚠️ リトライ ${attempt + 1}/${retries} (${delay}ms後)...`);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
		throw new Error("unreachable");
	}

	async function fetchImages() {
		const images = await prisma.image.findMany({
			where: { userId, status: UNEXPORTED },
		});
		console.log(`📊 取得した画像データ数: ${images.length}。`);

		const outputDir = path.join(process.cwd(), "image/dump");
		await mkdir(outputDir, { recursive: true });

		for (const image of images) {
			const { path: imagePath } = image as { path: string };
			const filePath = path.join(outputDir, imagePath);

			await mkdir(path.dirname(filePath), { recursive: true });
			await withRetry(() =>
				minioClient.fGetObject(
					env.MINIO_BUCKET_NAME ?? "",
					`images/original/${imagePath}`,
					filePath,
				),
			);
		}
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
