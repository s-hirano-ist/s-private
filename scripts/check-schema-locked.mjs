#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// CockroachDB v26.1+ では新規 CREATE TABLE に `WITH (schema_locked = false)` を
// 付与しないと `prisma migrate deploy` が P3018 で失敗する（詳細は docs/setup.md）。
// 本スクリプトはマイグレーション SQL の付与漏れを CI で検知する。

const MIGRATIONS_DIR = "packages/database/prisma/migrations";

/** migration.sql を再帰列挙 */
function collectMigrationSql(dir) {
	const files = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			files.push(...collectMigrationSql(full));
		} else if (entry === "migration.sql") {
			files.push(full);
		}
	}
	return files;
}

const violations = [];
for (const file of collectMigrationSql(MIGRATIONS_DIR)) {
	const sql = readFileSync(file, "utf8");
	// 文単位（`;` 区切り）で評価。Prisma の DDL は `;` を終端に使う。
	for (const statement of sql.split(";")) {
		if (!/\bCREATE TABLE\b/iu.test(statement)) continue;
		if (/schema_locked\s*=\s*false/iu.test(statement)) continue;
		const match = statement.match(
			/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?("?[\w.]+"?)/iu,
		);
		violations.push({ file, table: match ? match[1] : "(unknown)" });
	}
}

if (violations.length === 0) {
	console.log(
		"OK: all CREATE TABLE statements have WITH (schema_locked = false).",
	);
	process.exit(0);
}

console.error(
	"ERROR: CREATE TABLE without `WITH (schema_locked = false)` detected.",
);
console.error(
	"CockroachDB v26.1+ requires it or `prisma migrate deploy` fails with P3018.",
);
for (const v of violations) {
	console.error(`  - ${v.table} in ${v.file}`);
}
process.exit(1);
