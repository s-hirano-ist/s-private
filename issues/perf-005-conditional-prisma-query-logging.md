# Issue: Prismaクエリログの開発環境限定化

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | LOW |
| **Check Item** | サーバーサイドパフォーマンス |
| **Affected File** | `app/src/prisma.ts` |

## Problem Description

全DBクエリに対して `console.log` でタイミングをログ出力している。本番環境では不要なI/Oオーバーヘッドとなる。

### Current Code/Configuration

```typescript
// app/src/prisma.ts
const prismaClientSingleton = () => {
    const prisma = new PrismaClient({
        accelerateUrl: env.DATABASE_URL,
    }).$extends({
        query: {
            async $allOperations({ args, query, operation, model }) {
                const start = Date.now();
                const result = await query(args);
                const duration = Date.now() - start;
                console.log(`[${model}.${operation}] took ${duration}ms`);
                return result;
            },
        },
    });
    return prisma;
};
```

## Recommendation

`env.NODE_ENV === "development"` の場合のみログを出力する。

### Suggested Fix

```typescript
const prismaClientSingleton = () => {
    const prisma = new PrismaClient({
        accelerateUrl: env.DATABASE_URL,
    });

    if (env.NODE_ENV === "development") {
        return prisma.$extends({
            query: {
                async $allOperations({ args, query, operation, model }) {
                    const start = Date.now();
                    const result = await query(args);
                    const duration = Date.now() - start;
                    console.log(`[${model}.${operation}] took ${duration}ms`);
                    return result;
                },
            },
        });
    }

    return prisma;
};
```

## Implementation Steps

1. [ ] `app/src/prisma.ts` のクエリログを環境変数で条件分岐
2. [ ] 型の互換性を確認（`$extends` の有無で戻り値型が変わる可能性）
3. [ ] ビルド・動作確認
