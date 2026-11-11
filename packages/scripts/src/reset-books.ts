#!/usr/bin/env node
import { BooksBatchApplicationService } from "@s-hirano-ist/s-application/batch/books-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createBooksCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/books-command-repository";
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

	async function resetBooks() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createBooksCommandRepository(prisma);
		const batchService = new BooksBatchApplicationService(commandRepository);

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
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("reset-books", main);
