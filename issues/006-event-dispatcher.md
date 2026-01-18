# 006: イベント発行・購読の明確化

## 優先度: 低

## 概要

ドメインイベントは定義されているが、発行・購読の実装が不明確で、イベントハンドラーの管理が分散している。

## 現状

- ドメインイベント（`ArticleCreatedEvent`, `ArticleDeletedEvent`等）は定義済み
- `BaseDomainEvent`で共通構造を提供
- イベントハンドラーの初期化がインフラ層で行われている
- イベントディスパッチの実装が不明確

## 問題点

- イベント発行のタイミングが明確でない
- イベントハンドラーの登録・管理が分散
- イベント駆動アーキテクチャの恩恵を十分に受けられない

## 対象ファイル

- `packages/core/articles/events/` - ドメインイベント定義
- `packages/core/common/events/` - 共通イベント基盤
- `app/src/instrumentation.ts` - 初期化処理

## 改善案

### イベントディスパッチャーの実装

```typescript
// packages/core/common/events/event-dispatcher.ts
export interface IDomainEventDispatcher {
  dispatch<T extends BaseDomainEvent>(event: T): Promise<void>;
  subscribe<T extends BaseDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;
}

class DomainEventDispatcher implements IDomainEventDispatcher {
  private handlers = new Map<string, Array<(event: BaseDomainEvent) => Promise<void>>>();

  subscribe<T extends BaseDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler as any]);
  }

  async dispatch<T extends BaseDomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }
}

export const eventDispatcher = new DomainEventDispatcher();
```

### イベントハンドラーの登録を一元化

```typescript
// app/src/instrumentation.ts
import { eventDispatcher } from "@s-private/core/common/events/event-dispatcher";
import { handleArticleCreated } from "@/event-handlers/article-created-handler";
import { handleArticleDeleted } from "@/event-handlers/article-deleted-handler";

export async function register() {
  // イベントハンドラーの登録
  eventDispatcher.subscribe("ArticleCreatedEvent", handleArticleCreated);
  eventDispatcher.subscribe("ArticleDeletedEvent", handleArticleDeleted);
  // ...
}
```

### エンティティでのイベント発行

```typescript
// article-entity.ts
const articleEntity = {
  create: (args: CreateArticleArgs): [UnexportedArticle, ArticleCreatedEvent] => {
    const article = Object.freeze({
      id: makeId(),
      status: "UNEXPORTED",
      ...args,
    });

    const event = new ArticleCreatedEvent({
      articleId: article.id,
      title: article.title,
    });

    return [article, event];
  },
};
```

### アプリケーションサービスでのイベント発行

```typescript
// add-article.ts
export async function addArticle(formData: FormData) {
  const [article, event] = articleEntity.create(args);

  await commandRepository.insert(article);
  await eventDispatcher.dispatch(event);

  return success();
}
```

## 期待される効果

- イベント発行・購読のフローが明確に
- イベントハンドラーの管理が一元化
- 疎結合なアーキテクチャの実現
- 副作用（通知、ログ等）の分離

## 検証方法

1. イベントディスパッチャーを実装
2. `instrumentation.ts`でハンドラーを登録
3. 1つのユースケースでイベント発行を実装
4. `pnpm test` でテストがパスすることを確認
5. 段階的に他のユースケースにも適用
