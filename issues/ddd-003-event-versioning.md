# DDD-003: ドメインイベントにバージョニングがない

## 概要

`BaseDomainEvent`にイベントスキーマのバージョンを示すフィールドがない。
将来のスキーマ変更時に後方互換性を維持することが困難。

## 重要度

**LOW** - 将来の拡張性に関わる問題（現時点では実害なし）

## 現状

### BaseDomainEvent（base-domain-event.ts）

```typescript
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventType: string;      // "article.created"
  public readonly payload: Record<string, unknown>;
  public readonly metadata: {
    timestamp: Date;
    caller: string;
    userId: string;
    // version フィールドがない
  };
}
```

## 問題点

1. **スキーマ進化への対応困難**
   - イベントペイロードの構造を変更した場合、古いイベントとの区別ができない
   - イベントログを再処理する際にバージョン判定が不可能

2. **イベントソーシング導入の障壁**
   - イベントソーシングでは、異なるバージョンのイベントを適切に処理する必要がある
   - バージョン情報がないとマイグレーションが困難

3. **監査・デバッグの困難さ**
   - 問題発生時にどのバージョンのスキーマで記録されたか判別できない

## 対象ファイル

- `packages/core/shared-kernel/events/base-domain-event.ts`
- `packages/core/shared-kernel/events/domain-event.interface.ts`

## 推奨対応

### オプション A: バージョンフィールドの追加（推奨）

```typescript
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventType: string;
  public readonly version: number;  // 追加
  public readonly payload: Record<string, unknown>;
  public readonly metadata: { ... };

  constructor(
    eventType: string,
    version: number,  // 追加
    payload: Record<string, unknown>,
    metadata: { caller: string; userId: string },
  ) {
    this.eventType = eventType;
    this.version = version;
    // ...
  }
}

// 各イベントクラスでバージョンを指定
export class ArticleCreatedEvent extends BaseDomainEvent {
  static readonly VERSION = 1;

  constructor(data: { ... }) {
    super("article.created", ArticleCreatedEvent.VERSION, { ... }, { ... });
  }
}
```

### オプション B: 現状維持

- 現在イベントサブスクライバーが未実装
- イベントソーシングの予定がない
- 必要になった時点で対応

## 影響範囲

- `BaseDomainEvent`クラス
- `DomainEvent`インターフェース
- 全ドメインイベントクラス（コンストラクタ変更）
- イベントディスパッチャー（必要に応じて）

## 備考

DDDからの意図的な逸脱 002（イベントサブスクライバーの省略）により、
現時点でこの問題による実害はない。
イベントサブスクライバー実装を検討する際に併せて対応することを推奨。
