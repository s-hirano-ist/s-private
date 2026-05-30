// Guard: `prisma migrate dev` must target a LOCAL database only.
//
// CockroachDB Cloud keeps an internal multi-region enum `crdb_internal_region`
// even on single-region clusters. Prisma's `migrate dev` / `migrate status`
// detect it as schema drift and try to `DROP TYPE "crdb_internal_region"`,
// which fails with P3018 / SQLSTATE 2BP01. `migrate deploy` does not inspect
// drift and is unaffected.
//
// Workflow: generate migrations with `prisma:migrate:diff` (no DB needed) and
// apply them to the cloud with `prisma:deploy`.
const url = process.env.DATABASE_URL ?? "";

if (!/(localhost|127\.0\.0\.1)/.test(url)) {
	console.error(
		[
			"",
			'❌ "prisma migrate dev" はローカル DB 専用です（DATABASE_URL がローカルを指していません）。',
			"",
			"CockroachDB Cloud は単一リージョンでも multi-region メタデータ enum",
			'   "crdb_internal_region" を保持し、migrate dev / migrate status が',
			"   これを schema drift と誤検出して失敗します（P3018 / 2BP01）。",
			"",
			"➡  新規 migration の生成（DB 不要）:",
			"   pnpm --filter s-database prisma:migrate:diff -o prisma/migrations/<timestamp>_<name>/migration.sql",
			"   生成 SQL の新規 CREATE TABLE には WITH (schema_locked = false) を付与してください。",
			"",
			"➡  クラウド（dev-db / staging / prod）への適用:",
			"   pnpm --filter s-database prisma:deploy",
			"",
		].join("\n"),
	);
	process.exit(1);
}
