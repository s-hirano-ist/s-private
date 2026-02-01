# Issue: Delete操作のID検証がServer Action層で行われていない

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Priority** | LOW |
| **Check Item** | ユーザー入力バリデーション |
| **Affected File** | `app/src/application-services/articles/delete-article.ts`, `app/src/application-services/notes/delete-note.ts`, `app/src/application-services/images/delete-image.ts`, `app/src/application-services/books/delete-books.ts` |

## Problem Description

Delete系Server ActionsのID検証が、Server Action層ではなくCore層（`.core.ts`）の`makeId()`で行われています。これは機能上問題ありませんが、Add系操作との一貫性がなく、エラーがAPI境界より深い位置で発生します。

### Current Code/Configuration

```typescript
// app/src/application-services/articles/delete-article.ts
export async function deleteArticle(id: string): Promise<ServerAction> {
  const hasPermission = await hasDumperPostPermission();
  if (!hasPermission) forbidden();

  return deleteArticleCore(id, defaultDeleteArticleDeps);  // id: string（未検証）
}

// app/src/application-services/articles/delete-article.core.ts
export async function deleteArticleCore(id: string, deps: Dependencies) {
  // ...
  const { title } = await commandRepository.deleteById(
    makeId(id),  // ここでUUID検証
    userId,
    status,
  );
}
```

### Add操作との比較

```typescript
// Add操作のパターン（一貫したパターン）
export async function addArticle(formData: FormData) {
  // Server Action層でバリデーション
  const parsed = parseAddArticleFormData(formData, userId);  // Zod検証
  return addArticleCore(parsed, deps);
}
```

### Issues

1. Add操作とDelete操作でバリデーションのタイミングが異なる
2. 無効なUUIDのエラーメッセージがCore層のコンテキストで発生
3. デバッグ時にエラー発生箇所の特定に時間がかかる可能性

## Recommendation

Server Action層でID検証を行い、一貫したパターンにします。ただし、現状でも`makeId()`によるUUID検証は行われているため、優先度は低いです。

### Suggested Fix

```typescript
// app/src/application-services/articles/delete-article.ts
import { makeId } from "@s-hirano-ist/s-core/shared-kernel/value-objects/id";

export async function deleteArticle(rawId: string): Promise<ServerAction> {
  const hasPermission = await hasDumperPostPermission();
  if (!hasPermission) forbidden();

  // Server Action層でバリデーション
  const id = makeId(rawId);

  return deleteArticleCore(id, defaultDeleteArticleDeps);
}
```

```typescript
// app/src/application-services/articles/delete-article.core.ts
// 型をstringからIdに変更
export async function deleteArticleCore(id: Id, deps: Dependencies) {
  // ...
  const { title } = await commandRepository.deleteById(
    id,  // 既にId型
    userId,
    status,
  );
}
```

## Implementation Steps

1. [ ] `delete-article.ts`でmakeId()をインポートしバリデーション追加
2. [ ] `delete-article.core.ts`の引数型をstring→Idに変更
3. [ ] 同様に`delete-note.ts`を更新
4. [ ] 同様に`delete-image.ts`を更新
5. [ ] 同様に`delete-books.ts`を更新
6. [ ] テストを実行して動作確認

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- プロジェクト内の設計ドキュメント: `docs/architecture.md`
