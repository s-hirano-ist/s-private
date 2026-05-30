#!/usr/bin/env node
// One-shot data migration: Supabase PostgreSQL -> CockroachDB.
//
// Reads every row from SOURCE_DATABASE_URL (old Supabase) and writes it to
// TARGET_DATABASE_URL (new CockroachDB), then verifies that row counts match.
// Run AFTER `prisma migrate deploy` has created the schema on the target.
//
// FK order matters: categories must be inserted before articles
// (articles.categoryId references categories.id). The other tables are
// independent.
//
// NOTE: the Prisma client is generated for the cockroachdb provider, but the
// SELECTs issued against the Supabase source use standard SQL and work over the
// pg wire protocol. This is a throwaway migration script.
//
// Usage:
//   SOURCE_DATABASE_URL="postgresql://...supabase...:5432/postgres" \
//   TARGET_DATABASE_URL="postgresql://...cockroach...:26257/db?sslmode=verify-full" \
//   pnpm --filter s-scripts migrate-supabase-to-cockroach

import { createPrismaClient } from "@s-hirano-ist/s-database";

async function main() {
	const sourceUrl = process.env.SOURCE_DATABASE_URL;
	const targetUrl = process.env.TARGET_DATABASE_URL;
	if (!sourceUrl || !targetUrl) {
		throw new Error(
			"SOURCE_DATABASE_URL (Supabase) and TARGET_DATABASE_URL (CockroachDB) must be set.",
		);
	}

	const source = createPrismaClient(sourceUrl);
	const target = createPrismaClient(targetUrl);

	try {
		// 1. Categories first — articles.categoryId references them.
		const categories = await source.category.findMany();
		if (categories.length > 0)
			await target.category.createMany({ data: categories });

		// 2. Independent tables.
		const articles = await source.article.findMany();
		if (articles.length > 0)
			await target.article.createMany({ data: articles });

		const notes = await source.note.findMany();
		if (notes.length > 0) await target.note.createMany({ data: notes });

		const images = await source.image.findMany();
		if (images.length > 0) await target.image.createMany({ data: images });

		const books = await source.book.findMany();
		if (books.length > 0) await target.book.createMany({ data: books });

		// 3. Verify row counts match between source and target.
		const checks: [string, number, number][] = [
			[
				"category",
				await source.category.count(),
				await target.category.count(),
			],
			["article", await source.article.count(), await target.article.count()],
			["note", await source.note.count(), await target.note.count()],
			["image", await source.image.count(), await target.image.count()],
			["book", await source.book.count(), await target.book.count()],
		];

		let mismatch = false;
		for (const [name, s, t] of checks) {
			const ok = s === t;
			if (!ok) mismatch = true;
			console.log(`${ok ? "✅" : "❌"} ${name}: source=${s} target=${t}`);
		}
		if (mismatch) {
			throw new Error("Row count mismatch between source and target.");
		}
		console.log("✅ Migration completed: all row counts match.");
	} finally {
		await source.$disconnect();
		await target.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
