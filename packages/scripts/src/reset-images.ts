#!/usr/bin/env node
import { ImagesBatchApplicationService } from "@s-hirano-ist/s-application/batch/images-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createImagesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/images-command-repository";
import { createPushoverService } from "@s-hirano-ist/s-notification";

async function main() {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

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
		await notificationService
			.notifyInfo("reset-images completed", {
				caller: "reset-images",
			})
			.catch((error: unknown) => console.error("通知失敗:", error));
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService
			.notifyError(`reset-images failed: ${String(error)}`, {
				caller: "reset-images",
			})
			.catch((notifyError: unknown) => console.error("通知失敗:", notifyError));
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
