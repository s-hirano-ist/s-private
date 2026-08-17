# Edge Runtime with Cloudflare

## 概要

Cloudflare Workers/Edge Runtimeへの対応を検討し、レスポンス速度を改善する。
https://tech.hello.ai/entry/vercel-cloudflare-migration 等の実装を参考にする。
## 課題

- 画像処理は Photon WebAssembly へ移行済み。現在は `app/src/infrastructures/images/services/photon-image-processor.ts` が共通API経由で処理する。
- Prismaのedge対応状況の確認が必要（現状は`@prisma/adapter-pg`の`PrismaPg`（Node.jsのTCP pgプール）をCockroachDB Cloudに対して使用。`app/src/prisma.ts`で`connectionString`/`max`/`idleTimeoutMillis`を指定。論点は汎用的な「Prismaのedge対応」ではなく、adapter-pgのTCPプールをCloudflare Workers上で動かせるか）

## 現状の制約

- Next.js移行時に、唯一のedge runtimeルートだった`app/src/app/api/health/route.ts`からedge runtimeを**削除**した。理由はプロジェクト全体で有効化している`cacheComponents`（`app/next.config.mjs`）との非互換。
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
