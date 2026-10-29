#!/usr/bin/env node
import { NotesBatchApplicationService } from "@s-hirano-ist/s-application/batch/notes-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createNotesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/notes-command-repository";
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

	async function resetNotes() {
		// DDD: Create repository and domain service
		// Transaction is handled internally by repository's resetStatus method
		const commandRepository = createNotesCommandRepository(prisma);
		const batchService = new NotesBatchApplicationService(commandRepository);

		const result = await batchService.resetNotes(userId);

		console.log(
			`💾 LAST_UPDATEDのノートをEXPORTEDに変更しました（${result.finalized.count}件）`,
		);
		console.log(`💾 ${result.marked.count}件のノートをリセットしました`);
	}

	try {
		await resetNotes();
		await notificationService
			.notifyInfo("reset-notes completed", {
				caller: "reset-notes",
			})
			.catch((error: unknown) => console.error("通知失敗:", error));
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService
			.notifyError(`reset-notes failed: ${String(error)}`, {
				caller: "reset-notes",
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
