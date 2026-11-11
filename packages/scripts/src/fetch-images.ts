#!/usr/bin/env node
import {
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createObjectStorageClient } from "@s-hirano-ist/s-storage";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { runCli, cliNotifications } from "./lib/cli-observability.js";

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			if (attempt === retries - 1) throw error;
			const delay = 1000 * 2 ** attempt;
			console.warn(`⚠️ リトライ ${attempt + 1}/${retries} (${delay}ms後)...`);
			await setTimeout(delay);
		}
	}
	throw new Error("unreachable");
}

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
		S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = cliNotifications;

	const storageClient = createObjectStorageClient();

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();

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
				storageClient.downloadObject(
					env.S3_BUCKET_NAME ?? "",
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
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("fetch-images", main);
