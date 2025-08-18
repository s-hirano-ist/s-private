# DDD 導入 課題一覧

## 現在の実装で良好な実践

### 1. DTO変換パターンの適切な実装

#### 実装箇所
`src/application-services/books/get-books.ts:44-49`

```typescript
return {
  data: books.map((d) => ({
    id: d.id,
    title: d.title,
    href: d.ISBN,
    image: d.googleImgSrc ?? "/not-found.png",
  })),
  totalCount,
};
```

#### 評価
- アプリケーション層でドメインオブジェクトをUI用DTOに適切に変換
- ドメイン層の純粋性を保持
- プレゼンテーション層の要求に合わせたデータ構造を提供

### 2. リポジトリインターフェースの依存関係逆転

#### 実装箇所
- インターフェース: `src/domains/books/repositories/books-command-repository.interface.ts`
- 実装: `src/infrastructures/books/repositories/books-command-repository.ts`

#### 評価
- ドメイン層にインターフェースを配置し、インフラ層で実装
- 依存関係逆転の原則を正しく適用
- テスタビリティを確保

### 3. Zodによる堅牢な値オブジェクト実装

#### 実装箇所
`src/domains/books/entities/books-entity.ts:16-66`

#### 評価
- ブランド型による型安全性の確保
- バリデーションと型定義の一元化
- 不正な値の生成を防止

### 4. Form Data Parserの適切な責務分離

#### 実装箇所
`src/application-services/books/helpers/form-data-parser.ts`

#### 評価
- アプリケーション層での入力データ変換
- ドメイン層への純粋なデータ提供
- 外部入力の汚染防止

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

### 2. 集約の境界が不明確

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

### 3. ドメインイベントの欠如

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

### 4. 値オブジェクトの整理

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

## 追加で改善が必要な箇所

### 5. ユビキタス言語の整合性問題

#### 現状の問題点
`src/domains/common/entities/common-entity.ts`でのステータス定義：
```typescript
const Status = z.enum(["UNEXPORTED", "EXPORTED"]).brand<"Status">();
```

#### 問題
- 技術的な用語を使用（エクスポート処理の視点）
- ビジネスドメインの用語と乖離
- ドメインエキスパートとの会話で混乱の原因

#### 改善案
ビジネス用語への変更：
```typescript
const Status = z.enum(["DRAFT", "PUBLISHED"]).brand<"Status">();
```

### 6. エンティティの振る舞いの欠如

#### 現状の問題点
`src/domains/books/entities/books-entity.ts:92-105`：
```typescript
export const bookEntity = {
  create: (args: CreateBookArgs): Book => {
    // データ構造の生成のみ
  },
};
```

#### 問題
- エンティティに振る舞いがない
- ビジネスロジックがドメイン外に散在
- オブジェクト指向の利点を活用できていない

#### 改善案
エンティティクラスでの振る舞い実装：
```typescript
export class BookEntity {
  private constructor(private readonly props: Book) {}

  static create(args: CreateBookArgs): BookEntity {
    // バリデーションとビジネスルールの適用
    return new BookEntity(/* ... */);
  }

  export(): void {
    if (this.props.status === "PUBLISHED") {
      throw new InvalidStateError("Already published");
    }
    this.props = { ...this.props, status: makeStatus("PUBLISHED") };
  }

  get book(): Book {
    return Object.freeze({ ...this.props });
  }
}
```

### 7. リポジトリの責務範囲の問題

#### 現状の問題点
`src/infrastructures/books/repositories/books-command-repository.ts:16-20`：
```typescript
serverLogger.info(
  `【BOOKS】\n\nコンテンツ\nISBN: ${response.ISBN} \ntitle: ${response.title}\nの登録ができました`,
  { caller: "addBooks", status: 201, userId: response.userId },
  { notify: true },
);
```

#### 問題
- リポジトリがログ出力も担当
- 単一責任の原則に違反
- 副作用の責務が混在

#### 改善案
イベント駆動でのログ分離：
```typescript
// リポジトリは永続化のみに集中
class BooksCommandRepository {
  async create(data: Book) {
    await prisma.books.create({ data });
    // ログはイベントハンドラーで処理
  }
}
```

### 8. ドメインサービスの命名規則の問題

#### 現状の問題点
`src/domains/books/services/books-domain-service.ts:7`：
```typescript
export class BooksDomainService {
  public async ensureNoDuplicate(ISBN: ISBN, userId: UserId): Promise<void>
}
```

#### 問題
- 汎用的すぎる名前
- 具体的な責務が不明
- 複数の責務を持つ可能性

#### 改善案
具体的な責務を表す名前：
```typescript
export class BookDuplicationChecker {
  public async ensureNoDuplicate(ISBN: ISBN, userId: UserId): Promise<void>
}
```

### 9. トランザクション管理の不在

#### 現状の問題点
`src/application-services/books/add-books.ts:26-37`：
```typescript
await booksDomainService.ensureNoDuplicate(ISBN, userId);
const book = bookEntity.create({ ISBN, title, userId });
await booksCommandRepository.create(book);
```

#### 問題
- 明示的なトランザクション境界がない
- 部分的な失敗時の整合性保証なし
- 複数操作の原子性が確保されていない

#### 改善案
Unit of Workパターンの導入：
```typescript
export class AddBookUseCase {
  async execute(args: CreateBookArgs): Promise<void> {
    await this.unitOfWork.transaction(async (uow) => {
      await this.duplicationChecker.ensureNoDuplicate(args.ISBN, args.userId);
      const book = BookEntity.create(args);
      await uow.books.create(book);
    });
  }
}
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

### Phase 0: 即座に実施可能（影響小・効果中）
1. **エンティティへの振る舞い追加**（問題6）
   - 現在のファクトリー関数をクラスメソッドに変換
   - ビジネスロジックをエンティティに移動
2. **ドメインサービスの責務明確化と命名改善**（問題8）
   - `BooksDomainService` → `BookDuplicationChecker`
   - 具体的な責務を名前で表現
3. **ユビキタス言語の整合性改善**（問題5）
   - `UNEXPORTED`/`EXPORTED` → `DRAFT`/`PUBLISHED`
   - ビジネス用語への統一

### Phase 1: 基盤整備（優先度: 高）
1. **DIコンテナの導入**（問題1）
   - テスタビリティの向上
   - 依存関係の一元管理
2. **トランザクション管理の実装**（問題9）
   - Unit of Workパターンの導入
   - データ整合性の保証

### Phase 2: ドメイン層の改善（優先度: 中）
1. **値オブジェクトの分離**（問題4）
   - ファイル構造の整理
   - 関心事の分離
2. **集約の導入**（問題2）
   - トランザクション境界の明確化
   - ビジネス不変条件の保護
3. **リポジトリからのログ分離**（問題7）
   - 単一責任の原則の適用
   - 副作用の分離

### Phase 3: 高度な改善（優先度: 低）
1. **ドメインイベントの導入**（問題3）
   - イベント駆動アーキテクチャの実現
   - 疎結合化の促進
2. **CQRSパターンの実装**
   - 読み取りと書き込みの最適化
   - 複雑なクエリの分離
3. **仕様オブジェクトの導入**
   - 複雑なビジネスルールの表現
   - 再利用可能な条件定義

## まとめ

### 現在の実装の評価

**優秀な点:**
- **値オブジェクト実装**: Zodを使った型安全で堅牢な実装
- **依存関係逆転**: リポジトリインターフェースの適切な配置
- **DTO変換**: アプリケーション層での適切な責務分離
- **アーキテクチャ**: レイヤードアーキテクチャの基本構造

**改善が必要な点:**
1. **基盤レベル**: DIコンテナ、トランザクション管理の欠如
2. **ドメインモデル**: エンティティの振る舞い不足、ユビキタス言語の課題
3. **責務分離**: リポジトリへの副作用混入、ドメインサービスの曖昧な命名

### 推奨アプローチ

**短期（Phase 0）**: 既存コードへの小さな改善
- エンティティクラス化
- 命名の改善
- 用語の統一

**中期（Phase 1-2）**: アーキテクチャ基盤の強化
- DIコンテナ導入
- トランザクション管理
- 責務の明確化

**長期（Phase 3）**: 高度なDDDパターン
- ドメインイベント
- CQRS
- 仕様オブジェクト

この段階的アプローチにより、既存システムの安定性を保ちながら、堅牢で保守性の高いDDD実装を実現できます。