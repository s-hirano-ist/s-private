# `prisma migrate dev` が CockroachDB Cloud で使えない（crdb_internal_region drift）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Refactor / DX |
| **Priority** | LOW（運用ワークアラウンドで回避済み） |
| **Status** | 既知の制約として記録（恒久対応は上流修正待ち） |
| **Affected File** | [packages/database/package.json](../packages/database/package.json), [packages/database/scripts/guard-local-migrate.mjs](../packages/database/scripts/guard-local-migrate.mjs), [docs/setup.md](../docs/setup.md) |

## 問題

CockroachDB Cloud は単一リージョンのクラスタでも、内部に multi-region メタデータ enum
`crdb_internal_region` を保持する。Prisma の `prisma migrate dev` / `prisma migrate status`
は DB の実状態と schema を比較して drift を検出する際、この `crdb_internal_region` を
「schema に存在しない余分な enum」とみなして `DROP TYPE "crdb_internal_region"` を生成・実行
しようとし、**`P3018` / SQLSTATE `2BP01`（multi-region enum cannot be modified directly）で失敗**する。

- 既知の Prisma 課題: <https://github.com/prisma/prisma/issues/25696>
- `@@ignore` 等の Prisma schema 側の指定でも回避できないことが報告されている。
- **`prisma migrate deploy` は drift 検出を行わない**ため、この問題の影響を受けない。

実際に本プロジェクトでも、クラウド dev-db に対して `pnpm prisma:migrate`（= `migrate dev`）を
実行して `0_init` 適用後に `DROP TYPE crdb_internal_region` 生成で失敗した（`migrate resolve
--rolled-back` で復旧済み）。

## 現状の回避策（実装済み）

1. **`prisma:migrate`（dev）にガード**を追加（[guard-local-migrate.mjs](../packages/database/scripts/guard-local-migrate.mjs)）。
   `DATABASE_URL` が `localhost` / `127.0.0.1` 以外なら停止し、暴発を防ぐ。
2. **migration 生成は DB 不要の `prisma:migrate:diff`**（`prisma migrate diff --from-migrations
   --to-schema --script`）で行う。
3. **適用は常に `prisma:deploy`**（`migrate deploy`）。
4. 新規 `CREATE TABLE` には `WITH (schema_locked = false)` を手動付与（別件: v26.1+ schema_locked）。

詳細は [docs/setup.md](../docs/setup.md) の「マイグレーションの運用」節。

## 残る課題 / 改善余地

- **DX 低下**: migration 追加時に `mkdir` → `migrate:diff -o` → `WITH (schema_locked = false)`
  手動付与、という手数が必要。`migrate dev` のワンコマンド体験が失われている。
- 改善候補:
  - [ ] **diff フローの 1 コマンド化スクリプト**: 引数の migration 名から timestamp 付き
    ディレクトリ作成 → `migrate diff -o` → 新規 `CREATE TABLE` への `WITH (schema_locked = false)`
    自動付与までを行う `prisma:migrate:create <name>` ヘルパーを追加する。
  - [ ] あるいは **ローカル compose（insecure・multi-region なし）で `migrate dev` を使う運用**に
    切り替える（localhost なのでガードも通過）。生成した migration をクラウドへ `deploy`。
  - [ ] **上流の修正を追跡**: prisma#25696 がクローズされ `crdb_internal_region` を drift 対象から
    除外できるようになれば、本ワークアラウンドを撤廃して `migrate dev` を解禁できる。

## 関連

- schema_locked 制約: [docs/setup.md](../docs/setup.md)「CockroachDB v26.1+ の schema_locked」
