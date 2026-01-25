# DDD-002: ドメインイベントのペイロードで型情報が失われている

## 概要

`BaseDomainEvent`のペイロード型が`Record<string, unknown>`であるため、
イベント作成時にBranded Types（ArticleTitle, Url等）の型情報が失われる。

## 重要度

**MEDIUM** - 型安全性に関わる問題

## 現状

### BaseDomainEvent（base-domain-event.ts）

```typescript
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventType: string;
  public readonly payload: Record<string, unknown>;  // 型情報が失われる
  public readonly metadata: { ... };
}
```

### イベント作成時（article-entity.ts）

```typescript
const event = new ArticleCreatedEvent({
  title: article.title as string,      // ArticleTitle → string にキャスト
  url: article.url as string,          // Url → string にキャスト
  quote: (article.quote as string) ?? "",
  categoryName: categoryName as string,
  userId: article.userId as string,
  caller,
});
```

## 問題点

1. **Branded Typesの恩恵が失われる**
   - 値オブジェクトの型安全性がイベント層で消失
   - イベントハンドラーでは生のstring型として扱われる

2. **IDEサポートの低下**
   - イベント消費時の型補完が効かない
   - リファクタリング時の追跡が困難

3. **イベント駆動アーキテクチャへの障壁**
   - 将来的にイベントサブスクライバーを実装する際、型チェックが弱い

## 対象ファイル

- `packages/core/shared-kernel/events/base-domain-event.ts`
- `packages/core/articles/events/article-created-event.ts`
- `packages/core/articles/events/article-deleted-event.ts`
- その他全ドメインのイベントクラス

## 推奨対応

### オプション A: ジェネリック型の導入（推奨）

```typescript
export abstract class BaseDomainEvent<TPayload extends Record<string, unknown>>
  implements DomainEvent<TPayload> {

  public readonly eventType: string;
  public readonly payload: TPayload;  // 型パラメータ
  public readonly metadata: { ... };
}

// 使用例
export class ArticleCreatedEvent extends BaseDomainEvent<{
  title: ArticleTitle;
  url: Url;
  quote: Quote;
  categoryName: CategoryName;
}> {
  // ...
}
```

### オプション B: 現状維持 + ドキュメント

イベントペイロードはシリアライズを前提とするため、
生のプリミティブ型を使用する設計判断として明示的にドキュメント化。

## 影響範囲

- `BaseDomainEvent`クラス
- `DomainEvent`インターフェース
- 全ドメインイベントクラス
- イベントハンドラー（将来）

## 備考

現在イベントサブスクライバーが未実装（意図的な逸脱 002）のため、
実害は限定的。サブスクライバー実装時に併せて対応することも可能。
