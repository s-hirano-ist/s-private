# 008: キャッシュ無効化のRepository分離

## 概要

Repositoryにキャッシュ戦略が混在しており、関心事の分離が不完全。

## 現状

```typescript
// app/src/infrastructures/articles/repositories/articles-command-repository.ts
async function create(data: UnexportedArticle): Promise<void> {
  await prisma.article.create({ data });
  revalidateTag(buildContentCacheTag("articles", data.status, data.userId));
  revalidateTag(buildCountCacheTag("articles", data.status, data.userId));
}
```

類似のパターンが以下のファイルにも存在:
- `app/src/infrastructures/articles/repositories/articles-command-repository.ts`
- `app/src/infrastructures/books/repositories/books-command-repository.ts`
- `app/src/infrastructures/notes/repositories/notes-command-repository.ts`
- `app/src/infrastructures/images/repositories/images-command-repository.ts`

## 問題点

1. **関心事の混在**: Repositoryがデータ永続化とキャッシュ戦略の両方を担当
2. **ロジック分散**: キャッシュ無効化ロジックが各Repository全体に分散
3. **テスト困難**: テスト時にキャッシュ無効化の影響を制御しづらい
4. **変更影響**: キャッシュ戦略を変更する際に複数ファイルを修正する必要

## 改善案

### 案1: Application Service層への移動

キャッシュ無効化をApplication Serviceに移動し、Repositoryは純粋なデータアクセスに専念。

```typescript
// application-services/articles/create-article.ts
async function createArticle(data: CreateArticleInput) {
  await articlesCommandRepository.create(data);
  // キャッシュ無効化はここで実行
  revalidateTag(buildContentCacheTag("articles", data.status, data.userId));
  revalidateTag(buildCountCacheTag("articles", data.status, data.userId));
}
```

### 案2: Decoratorパターン

キャッシュ無効化を専用のDecoratorで実装。

```typescript
// infrastructures/cache/cache-invalidation-decorator.ts
function withCacheInvalidation<T extends Repository>(repository: T): T {
  return new Proxy(repository, {
    apply(target, thisArg, args) {
      const result = Reflect.apply(target, thisArg, args);
      // キャッシュ無効化ロジック
      return result;
    }
  });
}
```

### 案3: イベント駆動

ドメインイベントを利用してキャッシュ無効化を実行。

```typescript
// ドメインイベントサブスクライバーでキャッシュ無効化
domainEvents.subscribe("ArticleCreated", (event) => {
  revalidateTag(buildContentCacheTag("articles", event.status, event.userId));
});
```

## 優先度

低（現状の設計も許容範囲内）

## 現状許容の理由

- キャッシュ無効化がインフラ層内に閉じている
- Next.jsのrevalidateTagはインフラ関心事として妥当
- 現状の実装でも一貫性があり、理解しやすい

## 関連ドキュメント

- [docs/architecture.md](../docs/architecture.md)
