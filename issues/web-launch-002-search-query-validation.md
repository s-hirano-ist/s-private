# Issue: SearchQueryのZodスキーマバリデーションが未実装

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | HIGH |
| **Check Item** | ユーザー入力バリデーション |
| **Affected File** | `app/src/application-services/search/search-content-from-client.ts` |

## Problem Description

`searchContentFromClient` Server Actionの入力パラメータ`SearchQuery`にZodスキーマバリデーションが実装されていません。これにより、不正な入力やDoS攻撃のリスクがあります。

### Current Code/Configuration

```typescript
// app/src/application-services/search/search-content-from-client.ts
export async function searchContentFromClient(
  searchQuery: SearchQuery,  // No Zod validation
): Promise<ServerActionWithData<UnifiedSearchResults>> {
  const hasPermission = await hasViewerAdminPermission();
  if (!hasPermission) forbidden();

  try {
    const userId = await getSelfId();
    const data = await searchContent(searchQuery, userId);
    // ...
  } catch (error) {
    return await wrapServerSideErrorForClient(error);
  }
}
```

```typescript
// packages/core/shared-kernel/types/search-types.ts
export type SearchQuery = {
  query: string;
  contentTypes?: ContentType[];
  limit?: number;
};
```

### Issues

1. `query`文字列に長さ制限がない（非常に長いクエリでメモリ使用量増大）
2. `limit`に上限がない（`limit: 999999`でDoS攻撃の可能性）
3. `contentTypes`の値バリデーションがない
4. 他のServer Actions（add/delete系）ではZodを使用しているが、searchは一貫性がない

## Recommendation

SearchQuery用のZodスキーマを作成し、Server Action入口でバリデーションを実施します。

### Suggested Fix

```typescript
// packages/core/shared-kernel/types/search-types.ts に追加
import { z } from "zod";

export const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, { message: "required" })
    .max(256, { message: "tooLong" }),
  contentTypes: z
    .array(z.enum(["articles", "books", "notes"]))
    .optional(),
  limit: z
    .number()
    .int()
    .min(1, { message: "minimum" })
    .max(100, { message: "maximum" })
    .optional()
    .default(20),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
```

```typescript
// app/src/application-services/search/search-content-from-client.ts
import { SearchQuerySchema } from "@s-hirano-ist/s-core/shared-kernel/types/search-types";

export async function searchContentFromClient(
  rawSearchQuery: unknown,
): Promise<ServerActionWithData<UnifiedSearchResults>> {
  const hasPermission = await hasViewerAdminPermission();
  if (!hasPermission) forbidden();

  try {
    const searchQuery = SearchQuerySchema.parse(rawSearchQuery);
    const userId = await getSelfId();
    const data = await searchContent(searchQuery, userId);
    // ...
  } catch (error) {
    return await wrapServerSideErrorForClient(error);
  }
}
```

## Implementation Steps

1. [ ] `packages/core/shared-kernel/types/search-types.ts`にZodスキーマ追加
2. [ ] `searchContentFromClient`でスキーマバリデーション実施
3. [ ] 呼び出し元のコンポーネントを確認・更新
4. [ ] テストケースを追加（境界値、不正入力）

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security
