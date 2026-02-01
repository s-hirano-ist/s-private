# Issue: ページネーションパラメータの範囲バリデーションが未実装

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | MEDIUM |
| **Check Item** | ユーザー入力バリデーション |
| **Affected File** | `app/src/application-services/articles/load-more-articles.ts`, `app/src/application-services/notes/load-more-notes.ts`, `app/src/application-services/books/load-more-books.ts` |

## Problem Description

`loadMore*` Server Actionsの`currentCount`パラメータに範囲バリデーションがありません。負の値や極端に大きな値を渡すことでサーバーリソースを消費させる可能性があります。

### Current Code/Configuration

```typescript
// app/src/application-services/articles/load-more-articles.ts
export async function loadMoreExportedArticles(
  currentCount: number,  // No validation: could be negative, huge number, NaN, Infinity
): Promise<ServerActionWithData<LinkCardStackInitialData>>
```

```typescript
// app/src/application-services/notes/load-more-notes.ts
export async function loadMoreExportedNotes(
  currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>>
```

```typescript
// app/src/application-services/books/load-more-books.ts
export async function loadMoreExportedBooks(
  currentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>>
```

### Issues

1. `currentCount`が負の値でもエラーにならない
2. `NaN`や`Infinity`が渡される可能性
3. 極端に大きな値で不必要なDB負荷

## Recommendation

ページネーションパラメータ用のZodスキーマを作成し、Server Actionの入口でバリデーションを実施します。

### Suggested Fix

```typescript
// 共通のバリデーションスキーマ
const PAGINATION_COUNT_SCHEMA = z
  .number()
  .int({ message: "mustBeInteger" })
  .min(0, { message: "mustBeNonNegative" })
  .max(10000, { message: "exceedsMaximum" });

// 各Server Actionで使用
export async function loadMoreExportedArticles(
  rawCurrentCount: number,
): Promise<ServerActionWithData<LinkCardStackInitialData>> {
  const hasPermission = await hasViewerAdminPermission();
  if (!hasPermission) forbidden();

  try {
    const currentCount = PAGINATION_COUNT_SCHEMA.parse(rawCurrentCount);
    // ... rest of implementation
  } catch (error) {
    return await wrapServerSideErrorForClient(error);
  }
}
```

## Implementation Steps

1. [ ] 共通のページネーションスキーマを作成（`shared-kernel`に配置）
2. [ ] `loadMoreExportedArticles`にバリデーション追加
3. [ ] `loadMoreExportedNotes`にバリデーション追加
4. [ ] `loadMoreExportedBooks`にバリデーション追加
5. [ ] テストケースを追加（境界値、不正入力）

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security
