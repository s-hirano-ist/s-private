# ドメインイベントサブスクライバーの実装検討

## 概要

ドメインイベントの発行機構は実装されているが、購読（サブスクライバー）側の実装が限定的。イベント駆動アーキテクチャの活用拡大を検討する。

## 現状

### 実装済み

- エンティティ生成時にドメインイベントを生成
- `[Entity, Event]` タプルでの返却パターン
- イベント発行（`eventDispatcher.dispatch`）

### 未実装/不明確

- イベントサブスクライバーの構造
- 現在の購読先（監査ログのみ？）
- イベントの永続化

## 改善案

### 段階1: イベントサブスクライバーの構造化

```typescript
// app/src/event-handlers/
export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// 例: ArticleCreatedイベントのハンドラー
export class ArticleCreatedHandler implements IEventHandler<ArticleCreatedEvent> {
  async handle(event: ArticleCreatedEvent): Promise<void> {
    // 通知送信、検索インデックス更新など
  }
}
```

### 段階2: イベントバスの実装

```typescript
// app/src/event-bus/
export class EventBus {
  private handlers = new Map<string, IEventHandler[]>();

  register<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void {
    // ハンドラー登録
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }
}
```

### 活用例

1. **通知システム**: コンテンツ作成時にPushover通知
2. **検索インデックス**: コンテンツ更新時にインデックス再構築
3. **監査ログ**: 全イベントの記録（既存）
4. **キャッシュ無効化**: イベントベースのキャッシュ制御
5. **統計更新**: コンテンツ数のリアルタイム集計

## 対象ファイル

- `packages/core/*/events/` - イベント定義（既存）
- `app/src/event-handlers/` - 新規作成
- `app/src/event-bus/` - 新規作成
- `app/src/application-services/*/` - イベントバス利用

## 優先度

低

## 備考

- 現状の規模では必須ではない
- システム拡大時に有用性が増す
- 過度な抽象化を避け、必要になった時点で実装を検討
- 最初は単純なオブザーバーパターンから始め、必要に応じてメッセージキュー等に移行
