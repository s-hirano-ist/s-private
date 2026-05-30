# Supabase pgaudit 拡張による監査ログ有効化

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Status** | 未着手 / Supabase Dashboard 操作のみ |
| **Affected File** | コード変更ゼロ。Supabase Dashboard + SQL のみ |

## 概要

書き込み系（INSERT/UPDATE/DELETE/DDL）の監査証跡を残すため、Supabase の `pgaudit` 拡張を有効化する。Supabase 標準の Postgres Logs は接続イベント・遅いクエリ中心で、テーブル変更の監査が不足している。

## タスク

### 1. 拡張有効化

- [ ] Supabase Dashboard → Database → Extensions で `pgaudit` を有効化

### 2. SQL Editor で実行

```sql
ALTER ROLE app_migrator SET pgaudit.log = 'ddl, write';
ALTER ROLE app_runtime SET pgaudit.log = 'write';   -- ログ量が多ければ 'ddl' のみに絞る
ALTER DATABASE postgres SET pgaudit.log_parameter = off;  -- パラメータは出さない（PII 漏洩防止）
```

**重要**: `pgaudit.log_parameter = off` を必ず付ける。クエリパラメータが PII（メール・本文等）を含む可能性があるため。

### 3. 動作確認

- [ ] Supabase Logs Explorer で `pgaudit:` プレフィクスのログが出ることを確認
- [ ] 書き込み系操作（記事作成等）を行ってログに該当エントリが残ることを確認
- [ ] パラメータ値がログに含まれていないことを確認
- [ ] ログ量を見て `app_runtime` の `'write'` が許容範囲か判断（多すぎたら `'ddl'` のみに変更）

### 4. オプション: 外部 SIEM 連携

- [ ] 必要なら Supabase Log Drain を Logflare / Datadog 等に設定

## 依存関係

- **前提**: security-005-supabase-db-role-minimization 完了（`app_migrator` / `app_runtime` ロールが存在することが前提）

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase B-2
- pgaudit: https://github.com/pgaudit/pgaudit
