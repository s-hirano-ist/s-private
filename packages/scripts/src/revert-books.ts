#!/usr/bin/env node
import { BooksBatchDomainService } from "@s-hirano-ist/s-core/books/services/books-batch-domain-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPushoverService } from "@s-hirano-ist/s-notification";
import { createBooksCommandRepository } from "./infrastructures/books-command-repository";

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

	const { PrismaClient } = await import("@s-hirano-ist/s-database/generated");
	const prisma = new PrismaClient({
		accelerateUrl: env.DATABASE_URL ?? "",
	});

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");

	try {
		const commandRepository = createBooksCommandRepository(prisma);
		const batchService = new BooksBatchDomainService(commandRepository);

		const result = await batchService.revertBooks(userId);

		console.log(
			`💾 LAST_UPDATEDの本をUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService.notifyInfo("revert-books completed", {
			caller: "revert-books",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`revert-books failed: ${error}`, {
			caller: "revert-books",
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
