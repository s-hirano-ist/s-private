#!/usr/bin/env node
import { NotesBatchApplicationService } from "@s-hirano-ist/s-application/batch/notes-batch-service";
import {
	makeUserId,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { createPrismaClient } from "@s-hirano-ist/s-database";
import { createNotesCommandRepository } from "@s-hirano-ist/s-infrastructure/batch/notes-command-repository";
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
		const commandRepository = createNotesCommandRepository(prisma);
		const batchService = new NotesBatchApplicationService(commandRepository);

		const result = await batchService.revertNotes(userId);

		console.log(
			`💾 LAST_UPDATEDのノートをUNEXPORTEDに変更しました（${result.count}件）`,
		);
		await notificationService.notifyInfo("revert-notes completed", {
			caller: "revert-notes",
		});
	} finally {
		await prisma.$disconnect();
	}
}

await runCli("revert-notes", main);
