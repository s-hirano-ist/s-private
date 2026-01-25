# Issue 006: ImageCreatedEventのペイロードが意味的に不正確

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | ドメインイベント / ユビキタス言語 |
| **対象ファイル** | `packages/core/images/events/image-created-event.ts` |

## 現状

```typescript
export class ImageCreatedEvent extends DomainEvent<ImageCreatedPayload> {
  constructor(data: ImageCreatedData, caller: Caller) {
    super("image.created", { fileName: data.id }, new Date(), caller);
    //                        ^^^^^^^^^^^^^^^^
    //                        IDをfileNameとして渡している
  }
}
```

ペイロードで `id` を `fileName` として使用しており、意味的に不正確です。

## 問題点

- **ユビキタス言語の混乱**: `fileName` と `id` は異なる概念
- **イベント消費者への誤解**: イベントを受け取った側が `fileName` を実際のファイル名として扱う可能性
- **デバッグの困難さ**: ログ分析時に混乱を招く

## 改善案

ペイロードを意味的に正確なものに修正：

```typescript
type ImageCreatedPayload = {
  id: string;
  path: string;
  userId: string;
};

export class ImageCreatedEvent extends DomainEvent<ImageCreatedPayload> {
  constructor(
    data: { id: Id; path: Path; userId: UserId },
    caller: Caller
  ) {
    super(
      "image.created",
      {
        id: data.id as string,
        path: data.path as string,
        userId: data.userId as string,
      },
      new Date(),
      caller
    );
  }
}
```

## 影響範囲

- `packages/core/images/events/image-created-event.ts`
- イベントを発行している箇所（`imageEntity.create()` など）
- イベントを消費している箇所（存在する場合）

## 実装手順

1. `ImageCreatedPayload` 型を修正
2. `ImageCreatedEvent` コンストラクタを修正
3. イベント発行箇所を修正
4. `pnpm build` で確認
5. `pnpm test` で確認
