# CockroachDB セキュリティ強化（ロール分離・監査・ネットワーク）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | HIGH（ロール分離）/ MEDIUM〜LOW（他） |
| **Status** | ✅ ① ロール分離 = 完了（runtime最小化・dev統一・public剥奪・admin剥奪 済み。`admin = root` のみ）・② 監査 / ③ ネットワーク = 見送り・④ TLS = 確認済み |
| **Affected** | CockroachDB Cloud（1クラスタ内に `dev-db`・`prod-db`）, Doppler / Vercel / GitHub Secrets |

> 📓 実施手順の完全版（コマンド＋期待結果）は [docs/cockroachdb-role-minimization-runbook.md](../docs/cockroachdb-role-minimization-runbook.md) を参照。

## 現在のユーザー・ロール構成（実装結果）

CockroachDB Cloud Basic の **1クラスタ**内に `dev-db`（dev/preview）と `prod-db`（本番）の 2 DB。

| ユーザー | 範囲 | 権限 | クラスタadmin | 使用箇所 |
|----------|------|------|:------------:|----------|
| `root` | クラスタ | ALL（Cloud管理） | ✅ | Cloud Console 管理用 |
| `s-prod-runtime` | prod-db | 5テーブルの SELECT/INSERT/UPDATE/DELETE + schema・`Status`型 USAGE + CONNECT **のみ** | ❌ | Vercel **production** `DATABASE_URL`（アプリ実行） |
| `s-prod` | prod-db | 全オブジェクトの owner + DB/schema ALL（DDL） | ❌ 剥奪済み | GitHub Secret `PRODUCTION_DIRECT_URL`（migrate専用） |
| `s-dev` | dev-db | 全オブジェクトの owner + DB/schema ALL（DML+DDL+migrate） | ❌ 剥奪済み | Doppler dev `DATABASE_URL`（アプリ+スクリプト）／ Vercel **development** `DATABASE_URL`（migrate） |
| ~~`s-dev-runtime`~~ | — | **削除済み**（dev は `s-dev` 単一フル権限に統一） | — | — |

設計方針:
- **本番（prod-db）は厳格分離**: アプリ実行 = `s-prod-runtime`（DMLのみ＝SQLインジェクション時の被害を prod 本文の read/write に限定）／ migrate = `s-prod`（DDL、CI のみで注入に晒されない）。
- **dev（dev-db）は利便性優先**: `s-dev` 単一でアプリ・スクリプト・migrate を全部こなす（dev-db は破棄可能）。ただし **クラスタadminではない**ため、dev 資格情報が漏れても **prod-db / system / 他DB には到達不可**。
- runtime（露出面）はどちらも **admin ではない** ＝ 最優先の対策は完了。

## ① ロール最小化 — 実施済みの手順と期待結果

> admin で接続して実行。ハイフンを含む名前は要ダブルクォート（例 `"s-dev"`）。コンソールが `USE` を弾くため、対象は **DB修飾名**（`"prod-db".public.articles` 等）で指定する。

1. **棚卸し**: `SHOW DATABASES` / `SHOW ROLES` / `SHOW GRANTS ON ROLE admin` / `SHOW TABLES FROM "<db>"`
   - 期待結果: `s-dev`・`s-prod` が admin メンバー。`dev-db` のテーブル owner = `s-dev`、`prod-db` の owner = `s-prod`（→ admin 剥奪後も owner として DDL 維持できることが確定）。

2. **prod runtime 作成（DMLのみ）**:
   ```sql
   CREATE USER "s-prod-runtime" WITH PASSWORD '<hex>';
   GRANT CONNECT ON DATABASE "prod-db" TO "s-prod-runtime";
   GRANT USAGE ON SCHEMA "prod-db".public TO "s-prod-runtime";
   GRANT USAGE ON TYPE "prod-db".public."Status" TO "s-prod-runtime";
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
     "prod-db".public.categories, "prod-db".public.articles, "prod-db".public.notes,
     "prod-db".public.images, "prod-db".public.books TO "s-prod-runtime";
   ```
   - 期待結果: `SHOW GRANTS FOR "s-prod-runtime"` が **上記5テーブルの DML + schema/`Status` USAGE + CONNECT のみ**。`_prisma_migrations` も DDL も含まれない。

3. **`public` ロールの既定権限を剥奪**（全ユーザーがテーブル作成・schema使用できる既定の漏れを塞ぐ）:
   ```sql
   REVOKE CREATE ON SCHEMA "prod-db".public FROM public;
   REVOKE USAGE  ON SCHEMA "prod-db".public FROM public;
   REVOKE CREATE ON SCHEMA "dev-db".public  FROM public;
   REVOKE USAGE  ON SCHEMA "dev-db".public  FROM public;
   ```
   - 期待結果: `SHOW GRANTS ON SCHEMA "prod-db".public` が **admin / root のみ**（`public` 行が消える）。runtime ユーザーは直接付与した USAGE で動作継続。

4. **Vercel production `DATABASE_URL` を `s-prod-runtime` に差し替え** → 再デプロイ → 本番 CRUD 確認。
   - migrate 経路（GitHub Secret `PRODUCTION_DIRECT_URL` = `s-prod`）は変更しない。

5. **dev migrator（`s-dev`）の admin 剥奪**（owner + DB/schema ALL を先に付与してから剥奪）:
   ```sql
   GRANT ALL ON DATABASE "dev-db" TO "s-dev";
   GRANT ALL ON SCHEMA "dev-db".public TO "s-dev";
   REVOKE admin FROM "s-dev";
   ```
   - 期待結果: `SHOW GRANTS ON ROLE admin` から `s-dev` が消える。owner 権限のため migrate は維持。

6. **dev を `s-dev` に統一・`s-dev-runtime` を削除**:
   - Doppler dev `DATABASE_URL` を `s-dev` の接続文字列へ（Vercel development env と同値）。
   - 動作確認後、`s-dev-runtime` の grant を revoke → `DROP USER "s-dev-runtime"`。
   - 期待結果: `SHOW USERS` から `s-dev-runtime` が消える。`pnpm dev` / `pnpm prisma:deploy` / 各スクリプトが `s-dev` で成功。

7. **隔離確認**:
   - 期待結果: `SHOW GRANTS ON DATABASE "prod-db" FOR "s-dev"` = 空（dev→prod 不可）。`... FOR "s-prod-runtime"` を `dev-db` に対して = 空（prod→dev 不可）。

### 残作業 — 完了

- [x] **`s-prod` の admin 剥奪（Step 3b）= 完了**。`admin = root` のみになった。`s-prod` は owner + DB/schema ALL のため migrate（DDL）は維持。
  ```sql
  GRANT ALL ON DATABASE "prod-db" TO "s-prod";
  GRANT ALL ON SCHEMA "prod-db".public TO "s-prod";
  REVOKE admin FROM "s-prod";
  ```
  - ロールバックが必要な場合: `GRANT admin TO "s-prod"`。

## ② 監査ログ — 見送り

CockroachDB Cloud Basic はログエクスポート非対応のため、`EXPERIMENTAL_AUDIT` を有効化しても取り出し口がない。Advanced / Dedicated 移行時に再検討。

## ③ ネットワーク制限 — 見送り

Vercel runtime も GitHub Actions も固定 IP を持たず、IP Allowlist の実効性が低い。PrivateLink は Dedicated 専用。**`sslmode=verify-full` + 強パスワード**で担保する（④）。

## ④ TLS verify-full — 確認済み

全接続文字列（Doppler dev / Vercel production / Vercel development / GitHub `PRODUCTION_DIRECT_URL`）が `?sslmode=verify-full`。CockroachDB Cloud はパブリック CA のため CA pin 不要。

## 補足: schema_locked マイグレーション運用

CockroachDB v26.1+ では新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与しないと `prisma migrate deploy` が `P3018` で失敗する（詳細は [docs/setup.md](../docs/setup.md) の「CockroachDB v26.1+ の schema_locked」）。本番デプロイ前にマイグレーション SQL の付与漏れがないか確認するチェックを CI に追加する案を別途検討。
