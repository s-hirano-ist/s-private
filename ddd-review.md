# DDD 導入 課題一覧

## 改善が必要な箇所

### 1. ドメインサービスのインスタンス化の問題

#### 現状の問題点
アプリケーションサービスで直接インスタンス化している：
```typescript
// add-books.ts
const booksDomainService = new BooksDomainService(booksQueryRepository);
```

#### 問題
- テスタビリティの低下
- 依存関係の管理が分散
- モックの注入が困難

#### 改善案
DIコンテナまたはファクトリーパターンの導入：
```typescript
// domains/books/factories/books-domain-service.factory.ts
export const createBooksDomainService = (
  repository: IBooksQueryRepository
): BooksDomainService => {
  return new BooksDomainService(repository);
};
```

### 2. リポジトリインターフェースの配置

#### 現状の問題点
`domains/books/types.ts`にすべての型定義が混在：
- リポジトリインターフェース
- ドメイン固有の型
- その他の型定義

#### 改善案
```
domains/books/
├── repositories/
│   ├── books-command-repository.interface.ts
│   └── books-query-repository.interface.ts
├── types/
│   ├── cache-strategy.ts
│   └── sort-order.ts
```

### 3. 集約の境界が不明確

#### 現状の問題点
- エンティティが単体で存在
- 集約ルートが明確でない
- トランザクション境界が不明瞭

#### 改善案
集約の導入：
```typescript
// domains/books/aggregates/book.aggregate.ts
export class BookAggregate {
  private constructor(
    private readonly book: Book,
    private readonly reviews?: Review[],
  ) {}

  static create(args: CreateBookArgs): BookAggregate {
    const book = bookEntity.create(args);
    return new BookAggregate(book);
  }

  addReview(review: Review): void {
    // 集約内の整合性を保証
    this.validateReview(review);
    this.reviews.push(review);
  }
}
```

### 4. ドメインイベントの欠如

#### 現状の問題点
- イベント駆動の仕組みがない
- 副作用が直接実装されている
- 関心事の分離が不十分

#### 改善案
ドメインイベントの導入：
```typescript
// domains/books/events/book-created.event.ts
export class BookCreatedEvent {
  constructor(
    public readonly bookId: Id,
    public readonly userId: UserId,
    public readonly ISBN: ISBN,
    public readonly occurredAt: Date,
  ) {}
}

// エンティティでイベントを発火
export class BookEntity {
  private events: DomainEvent[] = [];

  create(args: CreateBookArgs): Book {
    const book = // ... 作成ロジック
    this.events.push(new BookCreatedEvent(
      book.id,
      book.userId,
      book.ISBN,
      new Date(),
    ));
    return book;
  }

  getEvents(): DomainEvent[] {
    return this.events;
  }
}
```

### 5. 値オブジェクトの整理

#### 現状の問題点
値オブジェクトとエンティティが同一ファイルに混在

#### 改善案
```
domains/books/
├── value-objects/
│   ├── isbn.vo.ts
│   ├── book-title.vo.ts
│   └── google-metadata.vo.ts
├── entities/
│   └── book.entity.ts
```

## 推奨される改善後のディレクトリ構造

```
src/
├── domains/                      # ドメイン層
│   ├── books/
│   │   ├── aggregates/          # 集約
│   │   │   └── book.aggregate.ts
│   │   ├── entities/            # エンティティ
│   │   │   └── book.entity.ts
│   │   ├── value-objects/       # 値オブジェクト
│   │   │   ├── isbn.vo.ts
│   │   │   └── book-title.vo.ts
│   │   ├── repositories/        # リポジトリインターフェース
│   │   │   ├── book-command.repository.ts
│   │   │   └── book-query.repository.ts
│   │   ├── services/            # ドメインサービス
│   │   │   └── book-domain.service.ts
│   │   ├── events/              # ドメインイベント
│   │   │   ├── book-created.event.ts
│   │   │   └── book-deleted.event.ts
│   │   ├── factories/           # ファクトリー
│   │   │   └── book.factory.ts
│   │   └── specifications/      # 仕様オブジェクト
│   │       └── book-validation.spec.ts
│   └── shared/                  # 共有ドメインオブジェクト
│       ├── value-objects/
│       └── base-classes/
├── application-services/         # アプリケーション層
│   ├── books/
│   │   ├── commands/            # コマンド（CQRSパターン）
│   │   │   ├── add-book.command.ts
│   │   │   └── delete-book.command.ts
│   │   ├── queries/             # クエリ（CQRSパターン）
│   │   │   └── get-books.query.ts
│   │   └── handlers/            # イベントハンドラー
│   │       └── book-event.handler.ts
├── infrastructures/              # インフラストラクチャ層
│   ├── persistence/             # 永続化
│   │   ├── books/
│   │   │   ├── book-command.repository.impl.ts
│   │   │   ├── book-query.repository.impl.ts
│   │   │   └── book.mapper.ts  # ORMマッピング
│   │   └── prisma/
│   ├── di/                      # 依存性注入
│   │   └── container.ts
│   └── events/                  # イベントバス実装
│       └── event-bus.ts
└── presentation/                 # プレゼンテーション層
    ├── components/
    └── pages/
```

## 実装の優先順位

### Phase 1: 基盤整備（優先度: 高）
1. DIコンテナの導入
2. リポジトリインターフェースの再配置

### Phase 2: ドメイン層の改善（優先度: 中）
1. 値オブジェクトの分離
2. 集約の導入
3. ファクトリーパターンの実装

### Phase 3: 高度な改善（優先度: 低）
1. ドメインイベントの導入
2. CQRSパターンの実装
3. 仕様オブジェクトの導入

## まとめ

現在の実装は、DDDの基本的な原則に従っており、特にドメイン層の値オブジェクトやエンティティの実装は優れています。また、アプリケーション層での適切なデータ変換（UI向けの型への変換）も実装されており、実用的なアプローチが取られています。

改善の余地がある点：

1. **依存性の管理**: DIコンテナの導入により、テスタビリティと保守性を向上
2. **集約の導入**: トランザクション境界と整合性の管理を改善  
3. **イベント駆動**: 副作用の分離と疎結合化の実現

これらの改善により、より堅牢で保守性の高いDDD実装を実現できます。