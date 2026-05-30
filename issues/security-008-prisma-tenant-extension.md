# Prisma Client Extensions による userId フィルタの DB 層強制

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Status** | 未着手 / 中規模リファクタ（100〜200行 + Server Action 入口ラッパ追加 + テストヘルパ） |
| **Affected File** | [app/src/prisma.ts](app/src/prisma.ts), `app/src/lib/tenant-context.ts`（新規）, Server Actions のエントリ全般 |

## 概要

現状、全リポジトリで `where: { userId, ... }` のテナント隔離が徹底されているが、**コードレビュー依存**でフェイルセーフが無い。新規開発者が `prisma.article.findMany({})` を直接呼んだ瞬間に全テナントのデータが返ってしまう。Prisma Client Extensions と `AsyncLocalStorage` を使い、対象モデルへの操作に `userId` を強制注入する Defense-in-Depth を導入する。

## なぜ必要か

- 既存リポジトリ層の `userId` 渡しはレビュー済みだが、新コード追加時のレビュー漏れリスクは残る
- Auth0 を使っているため Supabase の RLS（`auth.uid()`）が使えない → DB 層フェイルセーフは Prisma Extension で代替するのが現実解
- 既存リポジトリの `userId` 渡しは残したまま二重防御にできる（コード書き換え不要）

## 実装方針

### 1. AsyncLocalStorage によるテナントコンテキスト

```ts
// app/src/lib/tenant-context.ts
import { AsyncLocalStorage } from "node:async_hooks";
export const tenantContext = new AsyncLocalStorage<{
  userId: string;
  system?: boolean;
}>();
```

### 2. Prisma Extension で対象モデルに userId 強制注入

```ts
// app/src/prisma.ts に追加
const tenantExtension = Prisma.defineExtension({
  query: {
    article: {
      async $allOperations({ args, query, operation }) {
        const ctx = tenantContext.getStore();
        if (!ctx || ctx.system) return query(args);
        if (
          [
            "findMany", "findFirst", "findUnique",
            "update", "updateMany",
            "delete", "deleteMany",
            "count", "aggregate",
          ].includes(operation)
        ) {
          args.where = { AND: [args.where ?? {}, { userId: ctx.userId }] };
        }
        return query(args);
      },
    },
    // note, image, book, category も同様
  },
});
```

### 3. Server Action / Route Handler のエントリでラップ

```ts
tenantContext.run({ userId }, () => action(...));
```

`userId` が無いコンテキストでは対象モデルへのアクセスを拒否。cron / migration 等のシステム操作は `{ system: true }` で明示バイパス。

## タスク

- [ ] `app/src/lib/tenant-context.ts` を作成し `AsyncLocalStorage` を export
- [ ] [app/src/prisma.ts](app/src/prisma.ts) に `tenantExtension` を実装し `client.$extends(tenantExtension)` でチェーン
- [ ] 対象モデル（Article / Note / Image / Book / Category）すべてに対応
- [ ] Server Action 入口（`app/src/application-services/**/*.core.ts`）で `tenantContext.run({ userId }, ...)` を仕込むラッパを実装
- [ ] テストヘルパ（`tests/test-utils/with-tenant.ts` 等）を追加して全 unit test で context をセット
- [ ] 単体テスト: context 未セットで対象モデルにアクセスすると例外
- [ ] 統合テスト: ユーザーAのコンテキストでユーザーBの `articleId` を `update` しようとすると行が見つからずエラー
- [ ] 既存テストスイート全件 pass
- [ ] `createMany` / `upsert` / `groupBy` の `args` 操作の特殊ケース対応（Prisma 公式 `clientExtensions/queryFiltering` サンプル参照）
- [ ] 既存リポジトリの `userId` 渡しは**そのまま残す**（冗長だが二重防御）

## 注意点

- Prisma Extension は `findUnique` で複合主キーを使う場合に `where` 構造が変わる → 個別対応が必要
- system 操作（cron 等）が現状あるか確認し、必要なら `{ system: true }` パスを実装
- AsyncLocalStorage の context が Edge runtime では使えない可能性 → Node.js runtime 限定で動作することを確認

## 関連

- 計画ファイル: `/Users/s-hirano-ist/.claude/plans/prisma-orm-supabase-velvet-cat.md` Phase C-1
- Prisma Client Extensions: https://www.prisma.io/docs/orm/prisma-client/client-extensions
