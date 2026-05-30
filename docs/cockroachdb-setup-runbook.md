# CockroachDB セットアップ・移行 実行手順書

CockroachDB Cloud Basic への移行を完了するために**ユーザーが手動で実施する**手順。
コード側（schema / migration / env 整理 / ETL）は PR #2335 で対応済み。

> 用語: CockroachDB Cloud Basic = Serverless。従量課金（無料枠 $15/月 ≒ 50M RU + 10GiB）、
> 管理バックアップ 24h 間隔・30日保持。

---

## 1. CockroachDB Cloud クラスタ作成

1. <https://cockroachlabs.cloud/> でアカウント作成。**MFA を有効化**しておく。
2. **Basic** プランでクラスタを作成する。テストと本番は分離するのが安全:
   - テスト/preview 用: 例 `s-private-staging`
   - 本番用: 例 `s-private-prod`
3. クラウド/リージョンは Vercel の本番リージョンに近いものを選ぶ（レイテンシ低減）。

## 2. SQL ユーザーと接続文字列

1. 各クラスタで SQL ユーザーを作成し、パスワードを控える。
2. ⚠️ **Console / `ccloud` で作成したユーザーはデフォルトで `admin` ロール**が付く。移行作業中はこのまま進めてよいが、**移行完了後に必ず最小権限化**する（→ [issues/security-005-cockroachdb-hardening.md](../issues/security-005-cockroachdb-hardening.md)）。
3. 接続文字列を取得（**`sslmode=verify-full` を含む形**）:
   ```
   postgresql://<user>:<password>@<host>:26257/<db>?sslmode=verify-full
   ```
   CockroachDB Cloud の証明書はパブリック CA のため、追加の CA ファイルは不要。

## 3. 環境変数の設定

このリポジトリは **`DATABASE_URL` 1本**のみ使用する（`DIRECT_URL` と `POSTGRES_*` は廃止済み）。

- **dev / preview（Doppler）**: 各 config の `DATABASE_URL` を **staging クラスタ**の接続文字列に設定。
  - 旧 `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` / `DIRECT_URL` は**削除**。
- **本番（Vercel Dashboard）**: `DATABASE_URL` を **prod クラスタ**の接続文字列に設定。旧 Supabase 系は削除。
- **GitHub Secrets**: `PRODUCTION_DIRECT_URL`（[.github/workflows/prisma-deploy.yaml](../.github/workflows/prisma-deploy.yaml) が使用）を **prod クラスタ**の接続文字列に設定。
  - secret 名はそのまま流用可。`PRODUCTION_DATABASE_URL` 等にリネームしたい場合は prisma-deploy.yaml も合わせて修正する。

## 4. スキーマ適用（migrate deploy のみ）

> 🚫 **クラウドに対して `pnpm prisma:migrate`（= `migrate dev`）を実行しないでください。**
> CockroachDB Cloud の multi-region メタデータ `crdb_internal_region` を drift と誤検出し
> `P3018` / `2BP01` で失敗します。`prisma:migrate` には localhost 以外を弾くガードを設定済みです。
> クラウドへの適用は必ず **`prisma:deploy`** を使います。

- **本番**: PR #2335 をマージすると、`packages/database/prisma/migrations/**` の変更を検知して
  [prisma-deploy.yaml](../.github/workflows/prisma-deploy.yaml) が自動で `migrate deploy` を実行する。
- **dev-db / staging**（手動）:
  ```bash
  # env 注入経路（vercel env run -e development / doppler run）で DATABASE_URL を向ける
  <env注入> -- pnpm --filter s-database prisma:deploy
  ```

> ⚠️ 将来テーブルを追加する際は、**DB 不要の diff フロー**で生成する:
> 1. `schema.prisma` 編集 → `pnpm --filter s-database prisma:migrate:diff -o prisma/migrations/<dir>/migration.sql`
> 2. 生成 SQL の新規 `CREATE TABLE` に `WITH (schema_locked = false)` を付与
> 3. コミット → `prisma:deploy`（理由は [docs/setup.md](setup.md) の schema_locked / migrate dev 封印の節）。

## 5. データ移行（ETL）

旧 Supabase がまだ稼働している状態で実行する:

```bash
SOURCE_DATABASE_URL="<旧 Supabase 接続文字列>" \
TARGET_DATABASE_URL="<新 CockroachDB 接続文字列>" \
pnpm --filter s-scripts migrate-supabase-to-cockroach
```

出力の各テーブル count が `✅ source=N target=N` で一致することを確認する。

## 6. アプリ動作確認

1. preview / 本番デプロイ後、各ドメイン（articles / notes / images / books）の CRUD を確認。
2. Sentry に DB 接続エラー（`P1011` / `SELF_SIGNED_CERT_IN_CHAIN` / `P2034`）が出ないこと。

## 7. 後始末・フォローアップ

- 動作確認が済んだら Supabase プロジェクトを解約する。
  **解約前に**最終データの整合を再確認（→ [issues/security-006-cockroachdb-backup-dr.md](../issues/security-006-cockroachdb-backup-dr.md)）。
- Doppler / Vercel の旧 Supabase 環境変数を削除。
- 以下の issue に着手:
  - [security-005](../issues/security-005-cockroachdb-hardening.md): SQL ユーザーの最小権限化（**最優先**）・監査・ネットワーク
  - [security-006](../issues/security-006-cockroachdb-backup-dr.md): バックアップ / リストア確認
  - [security-007](../issues/security-007-db-password-rotation-runbook.md): パスワードローテーション手順書
  - [perf-010](../issues/perf-010-cockroachdb-connection-and-cost.md): 接続プール最適化・RU / コスト監視（**予算アラート設定を忘れずに**）

---

## チェックリスト（あなたが実施する作業）

- [ ] CockroachDB Cloud アカウント作成 + MFA 有効化
- [ ] staging / prod クラスタ作成（Basic）
- [ ] 各クラスタの接続文字列取得（`sslmode=verify-full`）
- [ ] Doppler に staging の `DATABASE_URL` 設定 + 旧 Supabase 変数削除
- [ ] Vercel に prod の `DATABASE_URL` 設定 + 旧 Supabase 変数削除
- [ ] GitHub Secrets `PRODUCTION_DIRECT_URL` を prod 接続文字列に更新
- [ ] PR #2335 マージ → 本番 migrate deploy 確認
- [ ] staging へ手動 migrate deploy
- [ ] ETL 実行 + count 一致確認（Supabase 稼働中に）
- [ ] アプリ動作確認（preview / 本番）
- [ ] Supabase 解約 + 旧環境変数削除
- [ ] フォローアップ issue 着手（予算アラート / ロール最小化）
