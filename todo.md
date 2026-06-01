# CockroachDB セキュリティ対応 TODO

issue 棚卸し結果（2026-05-30 時点）の作業分担。

- **対応**: security-005（①ロール分離・④TLS verify-full）/ security-004（本番動作確認）
- **見送り推奨**: security-005 の ②監査ログ・③ネットワーク制限（Vercel + Cloud Basic では実効性低 / 対応不可）
- **保留**: security-008（Prisma tenant extension）— ファイルは据え置き

---

## 🧑 自分でやること（クラスタ操作・シークレット・本番検証）

これらはクラスタへの接続権限・Doppler/Vercel のシークレット・デプロイ済み環境でしか確認できないため、自分で実施する。

### security-005 ① ロール最小化

- [ ] CockroachDB Cloud Basic で `CREATE USER` / `GRANT` が使えるか確認（Serverless系は権限制限あり。最初に手順を1つ流して弾かれないか確認）
- [ ] admin でクラスタに接続し、`app_runtime`(DMLのみ) と `app_migrator`(DDL) を強パスワードで作成
  ```sql
  CREATE USER app_migrator WITH PASSWORD '<strong-1>';
  GRANT ALL ON DATABASE <db> TO app_migrator;

  CREATE USER app_runtime WITH PASSWORD '<strong-2>';
  GRANT USAGE ON SCHEMA public TO app_runtime;
  GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE categories, articles, notes, images, books TO app_runtime;

  -- ★将来テーブルへ自動でDML付与（入れないと新テーブル毎に手動GRANTが必要）
  ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
  ```
- [ ] admin ロールが付いていないか確認・剥奪（Console作成ユーザーは付く既知挙動）
  ```sql
  SHOW GRANTS FOR app_runtime;   -- admin が無いことを確認
  REVOKE admin FROM app_runtime; -- 付いていた場合のみ
  REVOKE admin FROM app_migrator;
  ```
- [ ] Doppler(dev/preview) と Vercel(prod) にシークレット2本を登録
  - `DATABASE_URL` → `app_runtime` で接続（runtime + アプリ全般）
  - `MIGRATE_DATABASE_URL`（名前任意） → `app_migrator` で接続（マイグレーション専用）

### security-005 ④ TLS verify-full

- [ ] Doppler(dev/preview)・Vercel(prod) の `DATABASE_URL` / `MIGRATE_DATABASE_URL` 実値が全て `?sslmode=verify-full` で終わっているか確認（`require` 等に緩んでいないか）

### security-004 本番動作確認

- [ ] preview/本番で意図的にPrismaエラーを発生させ、Sentry に `source: prisma` タグ付きイベントが流入することを確認
- [ ] そのSentryイベントに **クエリ本文・パラメータが含まれていない** ことを確認（`errorFormat: "minimal"` の効果検証）
- [ ] `pnpm test` 全件 pass を CI で確認

---

## 🤖 Claude にお願いできること（コード・設定・issue の編集）

指示があれば実施する。勝手には触らない。

### security-005 関連

- [ ] **security-005 を ①④ 中心に整理**：②監査ログ・③ネットワーク制限の節を削除（見送り確定後）
- [ ] （任意）`app/src/env.ts` に `MIGRATE_DATABASE_URL` を追加
- [ ] （任意）`packages/database/package.json` の `prisma:deploy` を `MIGRATE_DATABASE_URL`（= `app_migrator`）で実行するよう変更、または Prisma schema の `datasource` に `directUrl` を追加して割当
- [ ] （任意）`app/src/env.ts` の Zod スキーマで本番のみ `sslmode=verify-full` を強制
  ```ts
  DATABASE_URL: z.string().refine(
    (v) => process.env.NODE_ENV !== "production" || v.includes("sslmode=verify-full"),
    "production では sslmode=verify-full 必須",
  ),
  ```
- [ ] （任意）schema_locked 付与漏れを検知する CI チェックの検討（issue 補足節）

### security-004 関連

- [ ] **issue の stale 参照修正**：`eslint.config.js` → `.oxlintrc.json`（A-2 ルールは `.oxlintrc.json:621` に移行済みで現役）
- [ ] lint 停止確認の補助：一時的に `prisma.$queryRawUnsafe("select 1")` を書いて `pnpm lint` が止まることを確認 → 確認後に削除
- [ ] （任意）`NODE_TLS_REJECT_UNAUTHORIZED` が production 環境変数に存在しないことを検査する CI スクリプト追加

---

## ⏸ 保留（今回アクションなし・ファイル据え置き）

- [ ] security-008 — Prisma Extension + AsyncLocalStorage による userId のDB層強制（中規模リファクタ。価値は用途次第）

---

## 対象外（CockroachDB 関連だが「セキュリティ対策」ではない）

- refactor-006 — `prisma migrate dev` の CockroachDB Cloud 制約（恒久回避済み）
