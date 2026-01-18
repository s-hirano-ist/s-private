# トランザクション境界の明確化

## 概要

現在、DB操作とイベント発行が別々のトランザクションで行われており、障害時に不整合状態が発生するリスクがある。

## 現状

```typescript
// 複数操作が別々のトランザクション
await commandRepository.create(article);    // DB書き込み
await eventDispatcher.dispatch(event);       // イベント発行
revalidateTag(...);                          // キャッシュ無効化
```

### 問題点

- DB書き込み成功後、イベント発行失敗の可能性
- 不整合状態のリスク（DBには記録あり、イベント未発行）
- キャッシュ無効化失敗時の古いデータ表示

## 改善案

### オプション1: Outbox Pattern（推奨）

イベントをDBに保存し、別プロセスで発行する。

```typescript
// 同一トランザクション内でイベントも保存
await prisma.$transaction(async (tx) => {
  await tx.article.create({ ... });
  await tx.outboxEvent.create({
    eventType: 'ArticleCreated',
    payload: JSON.stringify(event),
  });
});

// 別プロセスでoutboxを監視し、イベント発行
```

### オプション2: 明示的トランザクション

`prisma.$transaction()` を活用してアトミック性を確保。

```typescript
await prisma.$transaction(async (tx) => {
  await commandRepository.create(article, tx);
  await eventStore.save(event, tx);
});
// トランザクション成功後にイベント発行
await eventDispatcher.dispatch(event);
```

### オプション3: Saga Pattern

失敗時に補償トランザクションを実行。

```typescript
try {
  await commandRepository.create(article);
  await eventDispatcher.dispatch(event);
} catch (error) {
  // 補償: DBからの削除
  await commandRepository.delete(article.id);
  throw error;
}
```

## 対象ファイル

- `app/src/application-services/*/add-*.core.ts`
- `app/src/application-services/*/update-*.core.ts`
- `app/src/application-services/*/delete-*.core.ts`
- `app/src/infrastructures/*/prisma-*-command-repository.ts`

## 優先度

中

## 備考

- 現状の規模では大きな問題になりにくい
- システム拡大・複数サービス連携時に重要度が増す
- Outbox Patternは追加のインフラ（ポーリングまたはCDC）が必要
- 段階的アプローチ: まず明示的トランザクションから始め、必要に応じてOutboxに移行
