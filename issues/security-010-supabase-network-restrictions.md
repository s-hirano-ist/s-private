# Supabase Network Restrictions（migration 経路の IP allowlist）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW |
| **Status** | 未着手 / インフラ設定のみ |
| **Affected File** | コード変更ゼロ。Supabase Dashboard + GitHub Actions / bastion 設定 |

## 概要

DB パスワード漏洩時の最後の砦として Supabase Network Restrictions を活用する。Vercel Functions は動的 IP で allowlist 不可（Vercel Enterprise の Static IP は過剰）なので、**migration 経路のみ IP 制限**するハイブリッド案を採用する。

## 設計方針

| 経路 | ロール | IP 制限 | カバー方法 |
|---|---|---|---|
| migration | `app_migrator` | **あり**（GitHub Actions self-hosted runner / bastion 経由） | Network Restrictions |
| runtime | `app_runtime` | なし（動的 IP） | 強パスワード + ロール最小化（security-005） |

加えてオプションで「pooler のみ許可、Direct 5432 を閉じる」を有効化し攻撃面を減らす。

## タスク

- [ ] migration を実行する固定 IP を確保
  - [ ] GitHub Actions self-hosted runner を立てるか
  - [ ] または bastion ホスト（Conoha VPS 等）から `prisma migrate deploy` を実行する運用に変更
- [ ] 確保した IP / CIDR を Supabase Dashboard → Database → Network Restrictions に登録
- [ ] runtime（Vercel）からの接続は無制限のまま維持（`app_runtime` の権限で守る）
- [ ] **オプション**: 「Direct 5432 を閉じる」を Supabase Dashboard で有効化し pooler 経由のみに
- [ ] 動作確認: 制限外 IP からの `app_migrator` 接続が拒否されること、runtime（Vercel）からのアプリ動作に影響が無いこと

## 依存関係

- **前提**: security-005-supabase-db-role-minimization 完了（`app_migrator` ロール分離が前提）

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase D-1
- Supabase Network Restrictions: https://supabase.com/docs/guides/platform/network-restrictions
