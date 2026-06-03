# Edge Runtime with Cloudflare

## 概要

Cloudflare Workers/Edge Runtimeへの対応を検討し、レスポンス速度を改善する。
https://tech.hello.ai/entry/vercel-cloudflare-migration 等の実装を参考にする。
## 課題

- Edge RuntimeにSharpが対応していない（`sharp` 0.34.5 を使用。`app/next.config.mjs` の `serverExternalPackages` に登録され、`app/src/infrastructures/images/services/sharp-image-processor.ts` でサーバー実行を前提としている）
- Prismaのedge対応状況の確認が必要（現状は Prisma 7.8 + `@prisma/adapter-pg`（`PrismaPg`、node の TCP pg プール）を CockroachDB Cloud に対して使用。`app/src/prisma.ts` で `connectionString`/`max`/`idleTimeoutMillis` を指定。論点は汎用的な「Prisma の edge 対応」ではなく、adapter-pg の TCP プールを Cloudflare Workers 上で動かせるか）

## 現状の制約

- Next.js 16 移行時に、唯一の edge runtime ルートだった `app/src/app/api/health/route.ts` から edge runtime を**削除**した。理由はプロジェクト全体で有効化している `cacheComponents`（`app/next.config.mjs`）との非互換。
- そのため Cloudflare/Edge への移行は、この cacheComponents と Edge Runtime の非互換を先に解消する必要がある。

## 参考

- https://qiita.com/ayuareu/items/dc9abf9ba3f58699d9d9
- https://zenn.dev/arafipro/articles/2024-01-03-prisma-supabase-sample

## タスク

- [ ] cacheComponents と Edge Runtime の非互換性を解消する
- [ ] Edge Runtime対応の技術的制約を整理
- [ ] 対応可能な範囲の特定
- [ ] 段階的な移行計画の策定
- [ ] 実装

## 元GH Issue

- GH#808
