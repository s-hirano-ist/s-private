import { makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database/generated";
import type { BaseEnv } from "../shared/env.js";

export async function revertBooks(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);

	await prisma.book.updateMany({
		where: { userId, status: "LAST_UPDATED" },
		data: { status: "UNEXPORTED" },
	});
	console.log("LAST_UPDATED books changed to UNEXPORTED");
}
