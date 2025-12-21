import {
	makeExportedAt,
	makeLastUpdatedStatus,
	makeUnexportedStatus,
	makeUserId,
} from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database/generated";
import type { BaseEnv } from "../shared/env.js";

export async function resetImages(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);
	const UNEXPORTED = makeUnexportedStatus();
	const LAST_UPDATED = makeLastUpdatedStatus();
	const EXPORTED = "EXPORTED" as const;

	await prisma.$transaction(async (tx) => {
		// LAST_UPDATED → EXPORTED (前回バッチを確定)
		await tx.image.updateMany({
			where: { userId, status: LAST_UPDATED },
			data: { status: EXPORTED, exportedAt: makeExportedAt() },
		});
		console.log("LAST_UPDATED images changed to EXPORTED");

		// UNEXPORTED → LAST_UPDATED (今回バッチをマーク)
		const result = await tx.image.updateMany({
			where: { userId, status: UNEXPORTED },
			data: { status: LAST_UPDATED },
		});
		console.log(`${result.count} images reset`);
	});
}
