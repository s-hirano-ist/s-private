#!/usr/bin/env node
import { BooksBatchDomainService } from "@s-hirano-ist/s-core/books/services/books-batch-domain-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createBooksCommandRepository } from "./infrastructures/books-command-repository.ts";

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

	const { createPrismaClient } = await import("@s-hirano-ist/s-database");
	const prisma = createPrismaClient(env.DATABASE_URL ?? "");

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");

	async function resetBooks() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createBooksCommandRepository(prisma);
		const batchService = new BooksBatchDomainService(commandRepository);

		const result = await batchService.resetBooks(userId);

		console.log(
			`💾 LAST_UPDATEDの本をEXPORTEDに変更しました（${result.finalized.count}件）`,
		);
		console.log(`💾 ${result.marked.count}件の本をリセットしました`);
	}

	try {
		await resetBooks();
		await notificationService.notifyInfo("reset-books completed", {
			caller: "reset-books",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`reset-books failed: ${error}`, {
			caller: "reset-books",
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
