import {
	makeExportedAt,
	makeLastUpdatedStatus,
	makeUnexportedStatus,
	makeUserId,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common";
import { PrismaClient } from "@s-hirano-ist/s-database/generated";
import { createPushoverService } from "@s-hirano-ist/s-notification";

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

const prisma = new PrismaClient({ accelerateUrl: env.DATABASE_URL ?? "" });
const notificationService = createPushoverService({
	url: env.PUSHOVER_URL!,
	userKey: env.PUSHOVER_USER_KEY!,
	appToken: env.PUSHOVER_APP_TOKEN!,
});

// ドメイン型で安全にバリデーション
const userId: UserId = makeUserId(env.USERNAME_TO_EXPORT!);
const UNEXPORTED: Status = makeUnexportedStatus();
const LAST_UPDATED: Status = makeLastUpdatedStatus();
// makeExportedStatus()はオブジェクト型を返すため、Status型にはリテラルを使用
const EXPORTED: Status = "EXPORTED";

async function resetBooks() {
	await prisma.$transaction(async (tx) => {
		// LAST_UPDATED → EXPORTED (前回バッチを確定)
		await tx.book.updateMany({
			where: { userId, status: LAST_UPDATED },
			data: { status: EXPORTED, exportedAt: makeExportedAt() },
		});
		console.log("💾 LAST_UPDATEDの本をEXPORTEDに変更しました");

		// UNEXPORTED → LAST_UPDATED (今回バッチをマーク)
		const result = await tx.book.updateMany({
			where: { userId, status: UNEXPORTED },
			data: { status: LAST_UPDATED },
		});
		console.log(`💾 ${result.count}件の本をリセットしました`);
	});
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
}
