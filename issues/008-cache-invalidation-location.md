# キャッシュ無効化ロジックのインフラ層移動

## 概要

キャッシュタグ生成・無効化ロジックがアプリケーション層に存在しており、インフラストラクチャ関心事がビジネスロジックに漏洩している。

## 現状

### キャッシュタグ生成

```typescript
// app/src/common/utils/cache-tag-builder.ts
export function buildContentCacheTag(domain, status, userId): string {
  return `${domain}_${status}_${userId}`;
}
export function buildCountCacheTag(domain, status, userId): string {
  return `${domain}_count_${status}_${userId}`;
}
```

### キャッシュ無効化 (アプリケーション層で直接呼び出し)

```typescript
// app/src/application-services/articles/add-article.core.ts (line 73-76)
revalidateTag(buildContentCacheTag("articles", article.status, userId));
revalidateTag(buildCountCacheTag("articles", article.status, userId));
revalidateTag("categories");
```

同様のパターンが以下にも存在:
- `add-note.core.ts`, `delete-note.core.ts`
- `add-books.core.ts`, `delete-books.core.ts`
- `add-image.core.ts`, `delete-image.core.ts`

### 問題点

- キャッシュはインフラストラクチャ関心事だが、アプリケーション層から直接操作している
- Next.js固有の`revalidateTag`がビジネスロジックに混在
- フレームワーク変更時の影響範囲が大きい
- テスト時にキャッシュ操作のモックが必要

## 改善案

### オプション1: リポジトリでキャッシュ無効化を担当（推奨）

Command Repositoryの実装でキャッシュ無効化を行う。

```typescript
// app/src/infrastructures/articles/repositories/prisma-articles-command-repository.ts
async function create(data: UnexportedArticle): Promise<void> {
  await prisma.article.create({ data: { ... } });

  // インフラ層でキャッシュ無効化
  revalidateTag(buildContentCacheTag("articles", data.status, data.userId));
  revalidateTag(buildCountCacheTag("articles", data.status, data.userId));
}
```

### オプション2: イベントハンドラーでキャッシュ無効化

ドメインイベント購読者としてキャッシュ無効化を実装。

```typescript
// app/src/event-handlers/cache-invalidation-handler.ts
export class CacheInvalidationHandler implements IEventHandler<ArticleCreatedEvent> {
  async handle(event: ArticleCreatedEvent): Promise<void> {
    revalidateTag(buildContentCacheTag("articles", event.payload.status, event.payload.userId));
    revalidateTag(buildCountCacheTag("articles", event.payload.status, event.payload.userId));
  }
}
```

### オプション3: Unit of Work完了時にキャッシュ無効化

トランザクション完了コールバックでキャッシュ無効化を実行。

## 対象ファイル

### 移動元 (アプリケーション層)

- `app/src/common/utils/cache-tag-builder.ts`
- `app/src/application-services/articles/add-article.core.ts`
- `app/src/application-services/articles/delete-article.core.ts`
- `app/src/application-services/notes/add-note.core.ts`
- `app/src/application-services/notes/delete-note.core.ts`
- `app/src/application-services/books/add-books.core.ts`
- `app/src/application-services/books/delete-books.core.ts`
- `app/src/application-services/images/add-image.core.ts`
- `app/src/application-services/images/delete-image.core.ts`

### 移動先 (インフラ層)

- `app/src/infrastructures/common/cache/` または各リポジトリ内

## 優先度

中

## 備考

- 動作への影響は軽微（リファクタリング）
- Issue 005 (トランザクション境界) と関連
- Issue 007 (ドメインイベントサブスクライバー) でオプション2を採用する場合は統合可能
- まずはオプション1（リポジトリ責務）から始め、イベント駆動が必要になった時点でオプション2に移行
