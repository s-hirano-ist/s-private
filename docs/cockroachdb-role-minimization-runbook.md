# CockroachDB ロール最小化 実行手順書（security-005 ①）

CockroachDB Cloud の SQL ユーザーを **最小権限化（PoLP）** した作業の記録。コマンドと期待結果を込みでまとめた再現可能な手順。CockroachDB ハードニング（security-005）の single source。
ステータス: ① ロール最小化 = 完了 ／ ② 監査・③ ネットワーク = 見送り ／ ④ TLS verify-full = 確認済み。

## 背景・目的

- 構成: CockroachDB Cloud **Basic 1クラスタ**（region `gcp-asia-southeast1`）内に `dev-db`（dev/preview）と `prod-db`（本番）の 2 DB。
- 問題: Console/`ccloud` で作成した SQL ユーザー（`s-dev` / `s-prod`）は既定で **`admin`（クラスタ管理者）** 付き。runtime がこのまま接続していると、SQL インジェクション一発で全DB・systemテーブルの読取／DDL／ユーザー作成まで通る。
- 目的: **露出面（アプリ runtime）を DML のみに封じ込め**、migrator も自分のDBに限定し、`admin` は `root` のみにする。

## 最終構成

| ユーザー | 範囲 | 権限 | クラスタadmin | 接続文字列の保管場所 / 用途 |
|----------|------|------|:------------:|------------------------------|
| `root` | クラスタ | ALL（Cloud管理） | ✅（唯一） | Cloud Console 管理用 |
| `s-prod-runtime` | prod-db | 5テーブル DML + schema・`Status`型 USAGE + CONNECT のみ | ❌ | Vercel **Production** `DATABASE_URL` — 本番アプリ実行 |
| `s-prod` | prod-db | 全オブジェクト owner + DB/schema ALL（DDL） | ❌ | GitHub Secret `PRODUCTION_DIRECT_URL` — 本番 migrate（CI） |
| `s-dev` | dev-db | 全オブジェクト owner + DB/schema ALL（DML+DDL+migrate） | ❌ | Doppler dev `DATABASE_URL`（local app + preview + scripts）／ Vercel **Development** `DATABASE_URL`（local migrate） |
| ~~`s-dev-runtime`~~ | — | **削除済み** | — | dev は `s-dev` 単一に統一 |

設計判断:
- **prod は厳格分離**（runtime=DMLのみ / migrate=DDL、互いに別資格情報）。
- **dev は利便性優先で単一フル権限ユーザー**（dev-db は破棄可能）。ただし `s-dev` は**クラスタadminではない**ため、dev資格情報が漏れても prod-db / system へは到達不可。
- `MIGRATE_DATABASE_URL` は**導入しない**。runtime と migrate は「接続ソースの違い」（Vercel Production env / Vercel Development env / Doppler / GitHub Secret）で分離。

## 接続方法・注意

- CockroachDB Cloud の SQL Console に **admin（`root` 相当）** で接続して実行。
- ハイフンを含む識別子は **ダブルクォート必須**（例 `"s-dev"`, `"dev-db"`, `"Status"`）。
- Console は **`USE` を弾く**（`disallowed statement type`）。対象は **DB修飾名**（`"prod-db".public.articles` 等）で指定する。
- 強パスワードは **URLセーフな hex** を使う（base64 だと `+ / =` が接続URLで壊れる）:
  ```bash
  openssl rand -hex 32
  ```

---

## 手順

### Step 0. 棚卸し（read-only）

```sql
SHOW DATABASES;
SHOW ROLES;
SHOW GRANTS ON ROLE admin;
SHOW GRANTS FOR "s-dev";
SHOW GRANTS FOR "s-prod";
SHOW TABLES FROM "dev-db";
SHOW TABLES FROM "prod-db";
```
**期待結果:** `dev-db` / `prod-db` が存在。`s-dev`・`s-prod` が `admin` メンバー。`dev-db` のテーブル owner = `s-dev`、`prod-db` の owner = `s-prod`（→ admin 剥奪後も owner として DDL を維持できることが確定）。

### Step 1. `public` ロールの既定権限を剥奪（両DB）

Console/移行で作られたDBは `public` ロール（=全ユーザー）に schema の `CREATE`/`USAGE` が付いており、誰でもテーブルを作れてしまう。塞ぐ。

```sql
REVOKE CREATE ON SCHEMA "prod-db".public FROM public;
REVOKE USAGE  ON SCHEMA "prod-db".public FROM public;
REVOKE CREATE ON SCHEMA "dev-db".public  FROM public;
REVOKE USAGE  ON SCHEMA "dev-db".public  FROM public;
```
**確認:** `SHOW GRANTS ON SCHEMA "prod-db".public;`
**期待結果:** `admin` / `root` のみ（`public` 行が消える）。

### Step 2. prod の runtime ユーザー作成（DMLのみ）

```bash
openssl rand -hex 32   # <PROD_PW>
```
```sql
CREATE USER "s-prod-runtime" WITH PASSWORD '<PROD_PW>';
GRANT CONNECT ON DATABASE "prod-db" TO "s-prod-runtime";
GRANT USAGE ON SCHEMA "prod-db".public TO "s-prod-runtime";
GRANT USAGE ON TYPE "prod-db".public."Status" TO "s-prod-runtime";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "prod-db".public.categories, "prod-db".public.articles, "prod-db".public.notes,
  "prod-db".public.images, "prod-db".public.books
TO "s-prod-runtime";
```
**確認:** `SHOW GRANTS FOR "s-prod-runtime";`
**期待結果:** 上記5テーブルの DML + schema・`Status` USAGE + CONNECT **のみ**。`_prisma_migrations` も DDL も無い。`SHOW GRANTS ON DATABASE "dev-db" FOR "s-prod-runtime";` は **空**（prod→dev 隔離）。

### Step 3. 本番アプリを runtime ユーザーへ切替

- **Vercel Dashboard → Settings → Environment Variables → Production** の `DATABASE_URL` を差し替え（HOST は既存値から流用、DBは `prod-db`、`verify-full` 維持）:
  ```
  postgresql://s-prod-runtime:<PROD_PW>@<HOST>:26257/prod-db?sslmode=verify-full
  ```
  ⚠️ Preview / Development スコープは触らない。
- GitHub Secret `PRODUCTION_DIRECT_URL` は `s-prod` のまま（migrate用、変更しない）。
- 本番を **Redeploy** し、CRUD が成功することを確認。
**期待結果:** 本番アプリが `s-prod-runtime`（DMLのみ）で正常動作。Vercel の build は `prisma generate`+`tsc` のみなので runtime 資格情報でも壊れない。

### Step 4. dev を `s-dev` 単一に統一

`s-dev` は dev-db 全オブジェクトの owner ＋（次の admin 剥奪前提で）DB/schema ALL を持たせ、ローカルの全操作（app/scripts/migrate）をこの 1 ユーザーで賄う。

```sql
GRANT ALL ON DATABASE "dev-db" TO "s-dev";
GRANT ALL ON SCHEMA "dev-db".public TO "s-dev";
REVOKE admin FROM "s-dev";
```
- **Doppler の dev `DATABASE_URL`** を `s-dev` の接続文字列へ（= Vercel Development env と同値）。
- 動作確認（`pnpm dev` / `pnpm prisma:deploy` / `reset-*`・`ingest-*` スクリプト）後、不要になった `s-dev-runtime` を削除:
  ```sql
  REVOKE ALL ON TABLE "dev-db".public.categories, "dev-db".public.articles,
    "dev-db".public.notes, "dev-db".public.images, "dev-db".public.books FROM "s-dev-runtime";
  REVOKE ALL ON TYPE "dev-db".public."Status" FROM "s-dev-runtime";
  REVOKE ALL ON SCHEMA "dev-db".public FROM "s-dev-runtime";
  REVOKE ALL ON DATABASE "dev-db" FROM "s-dev-runtime";
  DROP USER "s-dev-runtime";
  ```
**確認:** `SHOW GRANTS ON ROLE admin;`（`s-dev` が消える）、`SHOW USERS;`（`s-dev-runtime` が消える）。
**期待結果:** dev のアプリ・スクリプト・migrate が全て `s-dev` で成功。`SHOW GRANTS ON DATABASE "prod-db" FOR "s-dev";` は **空**（dev→prod 隔離）。

### Step 5. prod の migrator（`s-prod`）の admin 剥奪

`s-prod` は prod-db 全オブジェクトの owner なので、admin を剥がしても migrate（DDL）は維持される。GRANT を先・REVOKE を後。

```sql
GRANT ALL ON DATABASE "prod-db" TO "s-prod";
GRANT ALL ON SCHEMA "prod-db".public TO "s-prod";
REVOKE admin FROM "s-prod";
```
**確認:** `SHOW GRANTS ON ROLE admin;`
**期待結果:** **`root` のみ**。次回 `packages/database/prisma/migrations/**` を変更して push したとき GitHub Actions `prisma-deploy` が成功する（`s-prod` は owner なので CREATE/ALTER/DROP 可）。

---

## 最終検証（end-to-end）

| 観点 | コマンド / 操作 | 期待結果 |
|------|----------------|---------|
| admin は root のみ | `SHOW GRANTS ON ROLE admin;` | `root` のみ |
| runtime は DML のみ | `SHOW GRANTS FOR "s-prod-runtime";` | 5テーブル DML + USAGE + CONNECT のみ |
| s-dev-runtime 削除 | `SHOW USERS;` | `s-dev-runtime` なし |
| public 剥奪 | `SHOW GRANTS ON SCHEMA "prod-db".public;` | `admin`/`root` のみ |
| dev→prod 隔離 | `SHOW GRANTS ON DATABASE "prod-db" FOR "s-dev";` | 0 rows |
| prod→dev 隔離 | `SHOW GRANTS ON DATABASE "dev-db" FOR "s-prod-runtime";` | 0 rows |
| 本番アプリ | 本番で CRUD | 成功（`s-prod-runtime`） |
| 本番 migrate | `migrations/**` 変更を push → `prisma-deploy` | 成功（`s-prod`） |
| ローカル | `pnpm dev` / `pnpm prisma:deploy` / scripts | 成功（`s-dev`） |

## env 接続文字列マッピング

| 保管場所 | 変数 | ユーザー | 用途 |
|----------|------|----------|------|
| Vercel Dashboard（Production） | `DATABASE_URL` | `s-prod-runtime` | 本番アプリ実行 |
| Vercel Dashboard（Development） | `DATABASE_URL` | `s-dev` | ローカル migrate（`pnpm prisma:deploy` / `prisma:studio` = `vercel env run -e development`） |
| Doppler（dev config） | `DATABASE_URL` | `s-dev` | ローカルアプリ（`pnpm dev`）+ preview + `packages/scripts/*` |
| GitHub Actions Secrets | `PRODUCTION_DIRECT_URL` | `s-prod` | 本番 migrate（`.github/workflows/prisma-deploy.yaml`） |

すべて末尾 `?sslmode=verify-full`（security-005 ④）。

## ロールバック早見表

| 操作 | 戻し方 |
|------|--------|
| アプリ runtime 切替（Vercel/Doppler） | `DATABASE_URL` を元の値に戻して再デプロイ |
| `REVOKE admin FROM "s-prod"` | `GRANT admin TO "s-prod";` |
| `REVOKE admin FROM "s-dev"` | `GRANT admin TO "s-dev";` |
| `public` 剥奪 | `GRANT USAGE, CREATE ON SCHEMA "<db>".public TO public;`（基本戻さない） |

## ④ TLS verify-full（確認済み）

全接続文字列（Doppler dev / Vercel production / Vercel development / GitHub `PRODUCTION_DIRECT_URL`）が `?sslmode=verify-full`。CockroachDB Cloud はパブリック CA のため CA pin 不要。

コードでの強制（fail-close）:

- `app/src/env.ts` — production では `DATABASE_URL` に `sslmode=verify-full` が含まれることを Zod `refine` で必須化。
- `app/src/instrumentation.ts` — production で `NODE_TLS_REJECT_UNAUTHORIZED=0` が設定されていれば `process.exit(1)` で起動を中断（TLS 検証の握り潰し防止）。
- `.github/workflows/ci.yaml` — CI で `NODE_TLS_REJECT_UNAUTHORIZED=0` を検知してジョブを失敗させる（多層防御）。

## 補足: schema_locked マイグレーション運用

CockroachDB v26.1+ では新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与しないと `prisma migrate deploy` が `P3018` で失敗する。

- `scripts/check-schema-locked.mjs`（`pnpm check:schema-locked`）がマイグレーション SQL の付与漏れを検査し、CI の `schema-locked` ジョブで実行。
- 詳細は [docs/setup.md](setup.md) の「CockroachDB v26.1+ の schema_locked」。関連する `migrate dev` 制約は [issues/refactor-006-cockroachdb-migrate-dev-limitation.md](../issues/refactor-006-cockroachdb-migrate-dev-limitation.md)。

## 補足: 見送り項目

- **② 監査ログ**: Cloud Basic はログエクスポート非対応。Advanced/Dedicated 移行時に再検討。
- **③ ネットワーク制限**: Vercel runtime / GitHub Actions とも固定IPなし → IP Allowlist の実効性低。`verify-full` + 強パスワードで担保。
