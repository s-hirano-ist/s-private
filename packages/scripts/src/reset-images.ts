#!/usr/bin/env node
import { ImagesBatchApplicationService } from "@s-hirano-ist/s-application/batch/images-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createImagesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/images-command-repository";
import { runCli, cliNotifications } from "./lib/cli-observability.js";

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = cliNotifications;

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");

	async function resetImages() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createImagesCommandRepository(prisma);
		const batchService = new ImagesBatchApplicationService(commandRepository);

		const result = await batchService.resetImages(userId);

		console.log(
			`💾 LAST_UPDATEDの画像をEXPORTEDに変更しました（${result.finalized.count}件）`,
		);
		console.log(`💾 ${result.marked.count}件の画像をリセットしました`);
	}

	try {
		await resetImages();
		await notificationService.notifyInfo("reset-images completed", {
			caller: "reset-images",
		});
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("reset-images", main);
