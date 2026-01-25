# [INFO] イベントサブスクライバーの簡易実装

## ステータス

- [x] 現状維持（情報共有用）

## 概要

現在のイベント処理はシンプルな同期的サブスクライバーパターンで実装されており、EventBusパターンや永続化機構は導入されていない。これは現在のシステム規模に対して適切な設計判断である。

## 現状

- イベントサブスクライバーは同期的に実行
- EventBusパターン未導入
- イベントの永続化なし
- `docs/domain-model.md`に文書化済み

## 現在の実装

```typescript
// シンプルなイベントサブスクライバー
class ArticleCreatedSubscriber {
  async handle(event: ArticleCreatedEvent): Promise<void> {
    await this.notificationService.notify(event);
  }
}

// アプリケーションサービスで直接呼び出し
async createArticle(input: CreateArticleInput): Promise<Article> {
  const article = await this.repo.save(newArticle);

  // 同期的にサブスクライバーを実行
  await this.articleCreatedSubscriber.handle(
    new ArticleCreatedEvent(article)
  );

  return article;
}
```

## 本格的なEventBusパターン（参考）

```typescript
// EventBusインターフェース
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: Constructor<T>,
    handler: EventHandler<T>
  ): void;
}

// 永続化対応EventBus
class PersistentEventBus implements EventBus {
  async publish(event: DomainEvent): Promise<void> {
    // 1. イベントを永続化
    await this.eventStore.save(event);

    // 2. サブスクライバーに非同期配信
    await this.dispatchToSubscribers(event);

    // 3. 失敗時はリトライキューに追加
  }
}
```

## 現状維持の理由

1. **システム規模**: 現在の規模ではオーバーエンジニアリング
2. **複雑性**: EventBus導入はデバッグ難易度を上げる
3. **通知失敗の許容**: 現状、通知失敗は致命的ではない

## 再検討条件

以下の条件が発生した場合、EventBusパターンの導入を検討する：

- [ ] 通知失敗時のリトライが必要となった場合
- [ ] イベント監査ログが必要となった場合（コンプライアンス要件）
- [ ] マイクロサービス分離が必要となった場合
- [ ] 非同期イベント処理が必要となった場合（大量イベント）
- [ ] イベントソーシングの導入を検討する場合

## EventBus導入時の検討事項

### 技術選択肢

1. **インメモリEventBus**: 最もシンプル、単一プロセス向け
2. **Redis Pub/Sub**: 複数インスタンス対応、永続化なし
3. **PostgreSQL LISTEN/NOTIFY**: DB統合、シンプル
4. **専用メッセージキュー（RabbitMQ, SQS等）**: 本格的な非同期処理

### 導入時の考慮点

- アウトボックスパターンの検討（トランザクション保証）
- 冪等性の確保（重複イベント対策）
- イベントスキーマのバージョニング
- 失敗イベントのデッドレターキュー

## 関連ドキュメント

- `docs/domain-model.md`
- `packages/core/shared-kernel/events/`

## 備考

このissueは情報共有を目的としており、対応は不要。
将来的なアーキテクチャ進化の参考情報として保持する。
