#!/usr/bin/env node
import { ArticlesBatchApplicationService } from "@s-hirano-ist/s-application/batch/articles-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createArticlesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/articles-command-repository";
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

	try {
		// DDD: Create repository and domain service
		const commandRepository = createArticlesCommandRepository(prisma);
		const batchService = new ArticlesBatchApplicationService(commandRepository);

		// Execute batch revert through domain service
		const result = await batchService.revertArticles(userId);

		console.log(
			`💾 LAST_UPDATEDの記事をUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService
			.notifyInfo("revert-articles completed", {
				caller: "revert-articles",
			})
			.catch((error: unknown) => console.error("通知失敗:", error));
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService
			.notifyError(`revert-articles failed: ${String(error)}`, {
				caller: "revert-articles",
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
