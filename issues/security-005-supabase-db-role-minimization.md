# Supabase DB ロール最小化（superuser 廃止）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | **HIGH（最優先・最高ROI）** |
| **Status** | 未着手 / Supabase Dashboard 操作が必要 |
| **Affected File** | コード変更ゼロ。Vercel/Doppler の `DATABASE_URL` / `DIRECT_URL` 切替のみ |

## 概要

現状 Prisma は Supabase の `postgres`（superuser 相当）ロールで接続している。SQL injection / Prisma バグ / クレデンシャル漏洩時の被害面積を最大化している状態。runtime と migration で別ロールに分離し、それぞれを最小権限にする。

## なぜ最優先か

- superuser は `auth.*` / `storage.*` / `pg_catalog` 全てに触れる。runtime ロールでこれが使えると、SQL injection で全テナントの認証情報まで読み取られる
- migrate / runtime の権限を分離することで、片方が乗っ取られた場合の影響範囲を限定できる
- パスワードローテーションも独立に行えるようになる
- **コード変更ゼロ**で実施可能（SQL DDL + ENV 切替のみ）

## タスク

### 1. Supabase Dashboard → SQL Editor で実行

```sql
-- 1) migration 用ロール（DDL OK、ただし superuser ではない）
CREATE ROLE app_migrator WITH LOGIN PASSWORD '<MIGRATOR_PWD_GENERATED>';
GRANT CREATE ON DATABASE postgres TO app_migrator;
GRANT ALL ON SCHEMA public TO app_migrator;

-- 2) runtime 用ロール（DML のみ、public スキーマの業務テーブル限定）
CREATE ROLE app_runtime WITH LOGIN PASSWORD '<RUNTIME_PWD_GENERATED>';
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- 3) Supabase 標準スキーマへのアクセスを runtime から剥がす
REVOKE ALL ON SCHEMA auth, storage, extensions FROM app_runtime;
```

**重要**: `ALTER DEFAULT PRIVILEGES` は `FOR ROLE app_migrator` を必ず付ける（今後 `app_migrator` が作るテーブルにも自動で権限伝播）。

### 2. 強パスワード生成

```bash
openssl rand -base64 32   # MIGRATOR 用
openssl rand -base64 32   # RUNTIME 用
```

### 3. Vercel/Doppler 環境変数を更新

- [ ] `DATABASE_URL` を `app_runtime` の認証情報に切替
- [ ] `DIRECT_URL` を `app_migrator` の認証情報に切替
- [ ] [packages/database/prisma.config.ts](packages/database/prisma.config.ts) は既に `DIRECT_URL` を読んでいるためコード変更不要

### 4. 事前確認

- [ ] [packages/database/prisma/migrations/](packages/database/prisma/migrations/) 配下に `CREATE EXTENSION` 等 superuser を要求する DDL が無いか grep
- [ ] Shadow DB の運用方法を確認（`prisma migrate dev` を使う場合は `shadowDatabaseUrl` 別途設定が必要な可能性）

### 5. ステージング先行検証

- [ ] migrate 実行（`pnpm prisma:migrate`）
- [ ] アプリ起動 → articles/notes/images/books の全 CRUD 疎通
- [ ] `psql` で `app_runtime` 接続のもと `SELECT * FROM auth.users LIMIT 1;` が **権限拒否されることを確認**
- [ ] Server Action 経由で `SELECT current_user;` を実行し `app_runtime` が返ることを確認

### 6. 本番切替

- [ ] ステージング検証 OK 後、本番 ENV を切替
- [ ] ロールバック計画: `DATABASE_URL` / `DIRECT_URL` を `postgres` に戻すだけで原状復帰

## 依存関係

- **後続**: security-006-supabase-pgaudit / security-007-db-password-rotation-runbook はこの issue 完了後に着手（ロール分離が前提）

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase B-1
- Supabase Roles: https://supabase.com/docs/guides/database/postgres/roles
