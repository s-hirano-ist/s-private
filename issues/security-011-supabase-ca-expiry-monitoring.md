# Supabase root CA 期限監視

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW |
| **Status** | 未着手 / security-009 採用時のみ着手 |
| **Affected File** | `.github/workflows/ca-expiry-check.yaml`（新規）または Renovate 設定 |

## 概要

security-009-supabase-tls-verify-full で Supabase root CA をリポジトリにコミットして pinning する場合、CA の `Not After`（失効日）を監視しないと、ある日突然 DB 接続が全停止する障害が発生する。Supabase は 2034 年までに新 CA へ移行予定なので、それまでに更新が必要。

## タスク（security-009 採用時のみ）

- [ ] 監視方法を選択:
  - [ ] **A. Renovate custom manager** で `packages/database/certs/supabase-ca.pem` の `Not After` を読み取り、期限が近づいたら PR を起こす
  - [ ] **B. GitHub Actions スケジュールジョブ**（月次）で `openssl x509 -enddate -noout -in supabase-ca.pem` を実行、残り日数をチェックして閾値（例: 90日）を切ったら Sentry / Pushover に通知
- [ ] 通知ルートを設定（既存の Pushover 連携に統合可）
- [ ] CA 更新時の差し替え手順を `docs/db-password-rotation.md` または別 runbook に記載
- [ ] 動作確認: 故意に古い CA をコミットして通知が飛ぶことを確認

## 依存関係

- **前提**: security-009-supabase-tls-verify-full で CA をコミットしている場合のみ必要
- パブリック CA で検証する方針（CA をコミットしない）にした場合、この issue は不要 → クローズ

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase D-2
