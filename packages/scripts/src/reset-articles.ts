#!/usr/bin/env node
import { ArticlesBatchDomainService } from "@s-hirano-ist/s-core/articles/services/articles-batch-domain-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createArticlesCommandRepository } from "./infrastructures/articles-command-repository.ts";
import { invalidateContentCache } from "./infrastructures/cache-invalidation-client.ts";

async function main() {
	const env = {
		CACHE_INVALIDATION_SECRET: process.env.CACHE_INVALIDATION_SECRET,
		CACHE_INVALIDATION_URL: process.env.CACHE_INVALIDATION_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		PUSHOVER_URL: process.env.PUSHOVER_URL,
		PUSHOVER_USER_KEY: process.env.PUSHOVER_USER_KEY,
		PUSHOVER_APP_TOKEN: process.env.PUSHOVER_APP_TOKEN,
		USERNAME_TO_EXPORT: process.env.USERNAME_TO_EXPORT,
	} as const;

	if (Object.values(env).some((v) => !v)) {
		throw new Error("Required environment variables are not set.");
	}

	// Dynamic import for Prisma ESM compatibility
	const { createPrismaClient } = await import("@s-hirano-ist/s-database");
	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");

	async function resetArticles() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createArticlesCommandRepository(prisma);
		const batchService = new ArticlesBatchDomainService(commandRepository);

		// Execute batch reset through domain service
		const result = await batchService.resetArticles(userId);

		// The database transaction has committed at this point. A cache failure is
		// treated as a failed batch run so it is logged and sent to Pushover.
		await invalidateContentCache(
			{
				url: env.CACHE_INVALIDATION_URL ?? "",
				secret: env.CACHE_INVALIDATION_SECRET ?? "",
			},
			"articles",
			userId,
		);

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
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(
			`reset-articles failed: ${String(error)}`,
			{
				caller: "reset-articles",
			},
		);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
