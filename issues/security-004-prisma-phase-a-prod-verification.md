# Phase A セキュリティ強化の本番動作確認

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Status** | コード実装は完了、本番動作確認のみ残 |
| **Affected File** | [app/src/prisma.ts](app/src/prisma.ts), [app/src/instrumentation.ts](app/src/instrumentation.ts), [eslint.config.js](eslint.config.js) |

## 概要

Prisma + Supabase セキュリティ強化計画 Phase A（軽量3点セット）はコード実装・lint・typecheck まで完了済み。本番デプロイ後の挙動確認のみ残っている。

## 完了済み内容

- **A-1**: `errorFormat: "minimal"` を本番に適用、`log: [{ emit: "event", level: "error" }]` で Prisma エラーを Sentry にルーティング、stdout からはクエリ本文を排除
- **A-2**: ESLint `no-restricted-syntax` で `$queryRawUnsafe` / `$executeRawUnsafe` の使用を恒久禁止（既存使用箇所ゼロ確認済み）
- **A-3**: `instrumentation.ts` の `register()` で `NODE_ENV=production` かつ `NODE_TLS_REJECT_UNAUTHORIZED=0` の場合に `process.exit(1)` で fail-closed

## タスク（本番動作確認）

- [ ] Preview/本番デプロイ後、意図的にPrismaエラーを起こし、Sentry にイベントが流入することを確認
- [ ] Sentry に流入したエラーペイロードに **クエリ本文・パラメータが含まれていない** ことを確認
- [ ] CI または Vercel ENV 検査で `NODE_TLS_REJECT_UNAUTHORIZED` が production 環境変数に存在しないことを確認するスクリプト追加（任意）
- [ ] `$queryRawUnsafe(...)` を試験的に書いて `pnpm lint` がエラーで止まることを確認
- [ ] 既存テストスイート全件 pass を CI で確認

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase A
