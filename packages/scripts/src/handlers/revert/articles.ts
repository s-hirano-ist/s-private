import { makeUserId } from "@s-hirano-ist/s-core/common";
import type { PrismaClient } from "@s-hirano-ist/s-database";
import type { BaseEnv } from "../shared/env.js";

export async function revertArticles(
	prisma: PrismaClient,
	env: BaseEnv,
): Promise<void> {
	const userId = makeUserId(env.USERNAME_TO_EXPORT);

	await prisma.article.updateMany({
		where: { userId, status: "LAST_UPDATED" },
		data: { status: "UNEXPORTED" },
	});
	console.log("LAST_UPDATED articles changed to UNEXPORTED");
}
