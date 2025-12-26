#!/usr/bin/env node
import {
	makeExportedAt,
	makeLastUpdatedStatus,
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common";
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

	// Dynamic import for Prisma ESM compatibility
	// @ts-expect-error - Prisma ESM export compatibility
	const { PrismaClient } = await import("@prisma/client");
	const prisma = new (PrismaClient as any)({
		accelerateUrl: env.DATABASE_URL ?? "",
	});

	const notificationService = createPushoverService({
		url: env.PUSHOVER_URL ?? "",
		userKey: env.PUSHOVER_USER_KEY ?? "",
		appToken: env.PUSHOVER_APP_TOKEN ?? "",
	});

	const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT ?? "");
	const UNEXPORTED: Status = makeUnexportedStatus();
	const LAST_UPDATED: Status = makeLastUpdatedStatus();
	const EXPORTED: Status = "EXPORTED";

	async function resetNotes() {
		await prisma.$transaction(async (tx: any) => {
			// LAST_UPDATED → EXPORTED (前回バッチを確定)
			await tx.note.updateMany({
				where: { userId, status: LAST_UPDATED },
				data: { status: EXPORTED, exportedAt: makeExportedAt() },
			});
			console.log("💾 LAST_UPDATEDのノートをEXPORTEDに変更しました");

			// UNEXPORTED → LAST_UPDATED (今回バッチをマーク)
			const result = await tx.note.updateMany({
				where: { userId, status: UNEXPORTED },
				data: { status: LAST_UPDATED },
			});
			console.log(`💾 ${result.count}件のノートをリセットしました`);
		});
	}

	try {
		await resetNotes();
		await notificationService.notifyInfo("reset-notes completed", {
			caller: "reset-notes",
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		await notificationService.notifyError(`reset-notes failed: ${error}`, {
			caller: "reset-notes",
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
