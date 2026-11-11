#!/usr/bin/env node
import { ArticlesBatchApplicationService } from "@s-hirano-ist/s-application/batch/articles-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createArticlesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/articles-command-repository";
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
		// DDD: Create repository and domain service
		const commandRepository = createArticlesCommandRepository(prisma);
		const batchService = new ArticlesBatchApplicationService(commandRepository);

		// Execute batch revert through domain service
		const result = await batchService.revertArticles(userId);

		console.log(
			`💾 LAST_UPDATEDの記事をUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService.notifyInfo("revert-articles completed", {
			caller: "revert-articles",
		});
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("revert-articles", main);
