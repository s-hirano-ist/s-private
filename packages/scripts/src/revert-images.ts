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

	try {
		const commandRepository = createImagesCommandRepository(prisma);
		const batchService = new ImagesBatchApplicationService(commandRepository);

		const result = await batchService.revertImages(userId);

		console.log(
			`💾 LAST_UPDATEDの画像をUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService.notifyInfo("revert-images completed", {
			caller: "revert-images",
		});
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("revert-images", main);
