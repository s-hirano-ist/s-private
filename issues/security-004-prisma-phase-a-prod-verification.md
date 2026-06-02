# Phase A セキュリティ強化の本番動作確認

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Status** | コード実装は完了、本番動作確認のみ残 |
| **Affected File** | [app/src/prisma.ts](app/src/prisma.ts), [app/src/instrumentation.ts](app/src/instrumentation.ts), [.oxlintrc.json](.oxlintrc.json) |

## 概要

Prisma + CockroachDB セキュリティ強化計画 Phase A（軽量3点セット）はコード実装・lint・typecheck まで完了済み。本番デプロイ後の挙動確認のみ残っている。内容は DB ベンダ非依存（errorFormat / lint / TLS fail-close）のため CockroachDB 移行後もそのまま有効。

## 完了済み内容

- **A-1**: `errorFormat: "minimal"` を本番に適用、`log: [{ emit: "event", level: "error" }]` で Prisma エラーを Sentry にルーティング、stdout からはクエリ本文を排除
- **A-2**: oxlint の `eslint-js/no-restricted-syntax`（`.oxlintrc.json:621`）で `$queryRawUnsafe` / `$executeRawUnsafe` の使用を恒久禁止（既存使用箇所ゼロ確認済み。ESLint から oxlint へ移行済みでルールは現役）
- **A-3**: `instrumentation.ts` の `register()` で `NODE_ENV=production` かつ `NODE_TLS_REJECT_UNAUTHORIZED=0` の場合に `process.exit(1)` で fail-closed

## タスク（本番動作確認）

- [ ] Preview/本番デプロイ後、意図的にPrismaエラーを起こし、Sentry にイベントが流入することを確認
- [ ] Sentry に流入したエラーペイロードに **クエリ本文・パラメータが含まれていない** ことを確認
- [x] CI ガード追加（任意）: `.github/workflows/ci.yaml` の `build` ジョブで `NODE_TLS_REJECT_UNAUTHORIZED=0` を検知し fail。※これは **CI 環境** の検査であり Vercel 本番環境変数の直接検査ではない（Vercel API 検査には VERCEL_TOKEN が必要）。本番ランタイムの実効的 fail-close は A-3（`instrumentation.ts`）が担保。本ガードは CI/Secrets への混入防止
- [x] `$queryRawUnsafe(...)` を試験的に書いて `pnpm lint` がエラーで止まることを確認（プローブで `eslint-js/no-restricted-syntax` 発火・exit 1 を確認後に削除済み）
- [ ] 既存テストスイート全件 pass を CI で確認
