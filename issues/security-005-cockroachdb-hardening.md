# CockroachDB セキュリティ強化（ロール分離・監査・ネットワーク）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | HIGH（ロール分離）/ MEDIUM〜LOW（他） |
| **Status** | 未着手（CockroachDB Cloud Basic クラスタ作成後に着手） |
| **Affected File** | CockroachDB Cloud 設定, Doppler/Vercel env, [packages/database/src/resolve-db-env.ts](../packages/database/src/resolve-db-env.ts) |

## 背景

Supabase 前提だった旧 issue（security-005 db-role / 006 pgaudit / 009 tls-verify-full / 010 network-restrictions / 011 ca-expiry）を、CockroachDB Cloud Basic 移行に伴い1つに統合・再設計したもの。旧 issue は削除済み。

## タスク

### 1. SQL ユーザーのロール最小化（最優先・最高ROI）

- 現状 migrate / runtime とも管理者ユーザーで接続していると、SQL injection で全テーブルが読める
- `app_runtime`（対象 DB の `SELECT/INSERT/UPDATE/DELETE` のみ）と `app_migrator`（DDL 権限）を分離
  ```sql
  CREATE USER app_runtime WITH PASSWORD '...';
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE categories, articles, notes, images, books TO app_runtime;
  CREATE USER app_migrator WITH PASSWORD '...';
  GRANT ALL ON DATABASE <db> TO app_migrator;
  ```
- `DATABASE_URL` を `app_runtime`、migrate 用接続（CI の `prisma migrate deploy`）を `app_migrator` に
- [ ] CockroachDB Cloud Basic で `CREATE USER` / `GRANT` が可能か確認（Serverless は権限制限あり）

### 2. 監査ログ

- CockroachDB に pgaudit は無い。代わりに **SQL Audit Logging**（`ALTER TABLE <t> EXPERIMENTAL_AUDIT SET READ WRITE`）または CockroachDB Cloud のログエクスポートを利用
- [ ] Cloud Basic で利用可能な監査機能の範囲を確認し、DML/DDL 監査証跡を有効化（PII を含むパラメータは記録しない方針）

### 3. ネットワーク制限

- CockroachDB Cloud の **IP Allowlist** / **PrivateLink**
- Vercel は固定 IP 非対応 → runtime は無制限、migrate 経路（CI runner / bastion）のみ allowlist、または `verify-full` + 強パスワードに依存
- [ ] migrate 経路の IP allowlist 設定可否を確認

### 4. TLS verify-full（対応済み・維持）

- 接続文字列の `sslmode=verify-full` を固定。[resolve-db-env.ts](../packages/database/src/resolve-db-env.ts) で `sslmode` を改変しないことを維持（Supabase 時の `no-verify` ハックは撤去済み）
- CockroachDB Cloud はパブリック CA のため CA pin 不要 → 旧 security-011（CA 期限監視）は不要

## 補足: schema_locked マイグレーション運用

CockroachDB v26.1+ では新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与しないと `prisma migrate deploy` が `P3018` で失敗する（詳細は [docs/setup.md](../docs/setup.md) の「CockroachDB v26.1+ の schema_locked」）。本番デプロイ前にマイグレーション SQL の付与漏れがないか確認するチェックを CI に追加する案を別途検討。

## 関連

- 移行計画: `/Users/s-hirano-ist/.claude/plans/postgresql-supabase-cockroach-db-iterative-toucan.md`
