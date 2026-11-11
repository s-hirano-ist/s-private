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

	async function resetArticles() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createArticlesCommandRepository(prisma);
		const batchService = new ArticlesBatchApplicationService(commandRepository);

		// Execute batch reset through domain service
		const result = await batchService.resetArticles(userId);

		console.log(
			`💾 LAST_UPDATEDの記事をEXPORTEDに変更しました（${result.finalized.count}件）`,
		);
		console.log(`💾 ${result.marked.count}件の記事をリセットしました`);
	}

	try {
		await resetArticles();
		await notificationService.notifyInfo("reset-articles completed", {
			caller: "reset-articles",
		});
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("reset-articles", main);
