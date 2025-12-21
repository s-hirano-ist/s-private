import {
	makeExportedAt,
	makeLastUpdatedStatus,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database";
import type { BaseEnv } from "../shared/env.js";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function resetBooks(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();
	const LAST_UPDATED = makeLastUpdatedStatus();
	const EXPORTED = "EXPORTED" as const;

	await prisma.$transaction(async (tx: TransactionClient) => {
		// LAST_UPDATED → EXPORTED (前回バッチを確定)
		await tx.book.updateMany({
			where: { userId, status: LAST_UPDATED },
			data: { status: EXPORTED, exportedAt: makeExportedAt() },
		});
		console.log("LAST_UPDATED books changed to EXPORTED");

		// UNEXPORTED → LAST_UPDATED (今回バッチをマーク)
		const result = await tx.book.updateMany({
			where: { userId, status: UNEXPORTED },
			data: { status: LAST_UPDATED },
		});
		console.log(`${result.count} books reset`);
	});
}
