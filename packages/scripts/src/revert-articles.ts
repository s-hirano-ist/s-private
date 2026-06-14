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

	try {
		// DDD: Create repository and domain service
		const commandRepository = createArticlesCommandRepository(prisma);
		const batchService = new ArticlesBatchDomainService(commandRepository);

		// Execute batch revert through domain service
		const result = await batchService.revertArticles(userId);

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
			`💾 LAST_UPDATEDの記事をUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService.notifyInfo("revert-articles completed", {
			caller: "revert-articles",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(
			`revert-articles failed: ${String(error)}`,
			{
				caller: "revert-articles",
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
