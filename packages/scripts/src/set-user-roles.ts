#!/usr/bin/env node
import { makeRole } from "@s-hirano-ist/s-core/users/entities/user-entity";

/**
 * Manually set (upsert) a user's roles.
 *
 * @remarks
 * Roles are the authorization source of truth in the database (`User.roles`).
 * Auth0 only provides identity, so a new user has no roles until set here.
 * Values are validated with the domain `makeRole` schema (VIEWER / DUMPER).
 *
 * @example
 * ```bash
 * vercel env run -e development -- pnpm --filter s-scripts set-user-roles "auth0|xxx" DUMPER VIEWER
 * ```
 */
async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("Required environment variable DATABASE_URL is not set.");
	}

	const [, , userId, ...rawRoles] = process.argv;
	if (!userId || rawRoles.length === 0) {
		throw new Error('Usage: set-user-roles "<userId>" <ROLE...>');
	}

	// Validate every role against the domain schema before touching the DB.
	const roles = rawRoles.map((r) => String(makeRole(r)));

	const { createPrismaClient } = await import("@s-hirano-ist/s-database");
	const prisma = createPrismaClient(databaseUrl);

	try {
		// NOTE: Prisma 7.8 + @prisma/adapter-pg + CockroachDB の組み合わせでは
		// `upsert` のクエリプラン解釈が壊れる（`TypeError: e.map is not a function`）。
		// 実証済みの findUnique + create/update に分解する。
		const existing = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});

		if (existing) {
			await prisma.user.update({ where: { id: userId }, data: { roles } });
		} else {
			await prisma.user.create({
				data: { id: userId, roles, createdAt: new Date() },
			});
		}

		console.log(`💾 ${userId} のrolesを設定しました: [${roles.join(", ")}]`);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
