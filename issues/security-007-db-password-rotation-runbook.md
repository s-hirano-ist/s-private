# DB パスワードローテーション手順書化

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW |
| **Status** | 未着手 |
| **Affected File** | `docs/db-password-rotation.md`（新規作成） |

## 概要

Doppler / Vercel に長期保管される DB パスワードの漏洩面積を限定するため、年2回のローテーション手順を runbook として文書化する。Supabase ↔ Vercel Marketplace 連携で `POSTGRES_PRISMA_URL` 自動更新が既に動いている（[packages/database/src/resolve-db-env.ts:31](packages/database/src/resolve-db-env.ts#L31) で参照）ので、Marketplace 経由のローテーションを使えば数クリックで完結する。

## タスク

- [ ] `docs/db-password-rotation.md` を新規作成
- [ ] 以下の手順を文書化:
  - [ ] **ダウンタイムゼロ手順（推奨）**: Vercel Marketplace の Supabase 連携でパスワード再生成 → `POSTGRES_PRISMA_URL` が自動更新される流れ
  - [ ] **手動手順（バックアップ）**: 二重稼働期間を作る方式
    1. `app_runtime_v2` / `app_migrator_v2` を作成（パスワード新規生成）
    2. Vercel/Doppler 環境変数を新ロールに切替してデプロイ
    3. 旧ロールを `DROP`
  - [ ] ロールバック手順
  - [ ] ローテーション周期（年2回推奨）と次回実施日の記録
- [ ] カレンダーリマインダー登録（年2回）
- [ ] CLAUDE.md または SECURITY.md の該当セクションから参照リンクを追加

## 依存関係

- **前提**: security-005-supabase-db-role-minimization 完了（`app_runtime` / `app_migrator` ロール分離が前提）

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase B-3
