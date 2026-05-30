# DB パスワードローテーション手順書化

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW |
| **Status** | 未着手 |
| **Affected File** | `docs/db-password-rotation.md`（新規作成） |

## 概要

Doppler / Vercel に長期保管される DB パスワードの漏洩面積を限定するため、年2回のローテーション手順を runbook として文書化する。CockroachDB Cloud Basic では Console もしくは SQL (`ALTER USER <user> WITH PASSWORD '<new>';`) でアプリ用 SQL ユーザーのパスワードを再生成できる。

## タスク

- [ ] `docs/db-password-rotation.md` を新規作成
- [ ] 以下の手順を文書化:
  - [ ] **ダウンタイムゼロ手順（推奨）**: `app_runtime_v2` / `app_migrator_v2` を新パスワードで作成 → Vercel/Doppler の `DATABASE_URL` を新ユーザーに切替してデプロイ → 旧ユーザーを `DROP USER`
  - [ ] **CockroachDB Cloud Console での再生成手順**（SQL ユーザー管理画面からパスワード再発行）
  - [ ] ロールバック手順
  - [ ] ローテーション周期（年2回推奨）と次回実施日の記録
- [ ] カレンダーリマインダー登録（年2回）
- [ ] SECURITY.md の該当セクションから参照リンクを追加

## 依存関係

- **前提**: [security-005-cockroachdb-hardening](security-005-cockroachdb-hardening.md) のロール分離（`app_runtime` / `app_migrator`）完了
