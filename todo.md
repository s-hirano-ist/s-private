# Contents Domain DDD改善タスク

## 概要
DDDの原則に基づき、contentsドメインの実装を改善する。主にドメインイベント、集約ルート、仕様パターンの導入を行い、よりビジネスロジックを表現力豊かに実装する。

## 1. ドメインイベントの導入

### 1.1 基盤となるイベントシステムの実装

#### タスク: ベースイベントクラスの作成
- **ファイル**: `src/domains/common/events/domain-event.ts`
- **内容**: 
  ```typescript
  export abstract class DomainEvent {
    public readonly occurredAt: Date = new Date();
    public readonly eventId: string = crypto.randomUUID();
    
    abstract get eventName(): string;
  }
  ```

#### タスク: イベントバスの実装
- **ファイル**: `src/domains/common/events/event-bus.ts`
- **内容**:
  - イベントの発行・購読機能
  - イベントハンドラーの登録・実行
  - 非同期処理対応

### 1.2 Contentsドメインイベントの実装

#### タスク: ContentCreatedEventの作成
- **ファイル**: `src/domains/contents/events/content-created-event.ts`
- **内容**:
  ```typescript
  export class ContentCreatedEvent extends DomainEvent {
    constructor(
      public readonly content: Content,
      public readonly userId: UserId
    ) {
      super();
    }
    
    get eventName(): string {
      return 'ContentCreated';
    }
  }
  ```

#### タスク: イベントハンドラーの実装
- **ファイル**: `src/application-services/contents/handlers/content-created-handler.ts`
- **責務**:
  - キャッシュ無効化
  - ログ記録
  - 通知送信
- **内容**: イベントを受け取って副作用を実行

### 1.3 エンティティファクトリの修正

#### タスク: contentEntityの修正
- **ファイル**: `src/domains/contents/entities/contents-entity.ts`
- **変更内容**:
  - `create`メソッドがイベントも返すように修正
  - 戻り値を `{ content: Content; events: DomainEvent[] }` に変更

### 1.4 アプリケーションサービスの修正

#### タスク: add-contentsの修正
- **ファイル**: `src/application-services/contents/add-contents.ts`
- **変更内容**:
  - イベントバスの注入
  - 作成されたイベントの発行
  - 直接的なキャッシュ無効化とログ記録の削除

## 2. 集約ルートの明確化

### 2.1 Content集約の設計

#### タスク: Content集約クラスの作成
- **ファイル**: `src/domains/contents/aggregates/content-aggregate.ts`
- **内容**:
  ```typescript
  export class ContentAggregate {
    private constructor(
      private readonly _content: Content,
      private _comments: Comment[] = [],
      private _domainEvents: DomainEvent[] = []
    ) {}
    
    static create(args: CreateContentArgs): ContentAggregate {
      // 集約の作成ロジック
      // ドメインイベントの生成
    }
    
    // 不変条件の検証
    private ensureInvariants(): void {
      // ビジネスルール検証
    }
    
    // イベント取得
    getUncommittedEvents(): DomainEvent[] {
      return [...this._domainEvents];
    }
    
    // イベントクリア
    markEventsAsCommitted(): void {
      this._domainEvents = [];
    }
  }
  ```

### 2.2 集約リポジトリの実装

#### タスク: 集約リポジトリインターフェースの定義
- **ファイル**: `src/domains/contents/repositories/content-aggregate-repository.ts`
- **内容**:
  ```typescript
  export interface IContentAggregateRepository {
    findById(id: Id, userId: UserId): Promise<ContentAggregate | null>;
    save(aggregate: ContentAggregate): Promise<void>;
    remove(aggregate: ContentAggregate): Promise<void>;
  }
  ```

#### タスク: 集約リポジトリの実装
- **ファイル**: `src/infrastructures/contents/repositories/content-aggregate-repository.ts`
- **責務**:
  - 集約の永続化
  - ドメインイベントの発行
  - トランザクション管理

### 2.3 既存サービスの集約対応

#### タスク: ContentsDomainServiceの修正
- **変更内容**:
  - 集約を引数として受け取るように修正
  - より複雑なビジネスルールの実装

## 3. 仕様パターンの導入

### 3.1 仕様パターンの基盤実装

#### タスク: ベース仕様クラスの作成
- **ファイル**: `src/domains/common/specifications/specification.ts`
- **内容**:
  ```typescript
  export interface Specification<T> {
    isSatisfiedBy(candidate: T): boolean;
    and(other: Specification<T>): Specification<T>;
    or(other: Specification<T>): Specification<T>;
    not(): Specification<T>;
  }
  
  export abstract class CompositeSpecification<T> implements Specification<T> {
    abstract isSatisfiedBy(candidate: T): boolean;
    
    and(other: Specification<T>): Specification<T> {
      return new AndSpecification(this, other);
    }
    
    or(other: Specification<T>): Specification<T> {
      return new OrSpecification(this, other);
    }
    
    not(): Specification<T> {
      return new NotSpecification(this);
    }
  }
  ```

#### タスク: 複合仕様の実装
- **ファイル**: `src/domains/common/specifications/composite-specifications.ts`
- **内容**: `AndSpecification`, `OrSpecification`, `NotSpecification`の実装

### 3.2 Contentsドメイン用仕様の実装

#### タスク: コンテンツ仕様クラスの作成
- **ファイル**: `src/domains/contents/specifications/content-specifications.ts`
- **実装する仕様**:
  - `PublishableContentSpec`: 公開可能な条件
  - `EditableContentSpec`: 編集可能な条件
  - `ArchivableContentSpec`: アーカイブ可能な条件
  - `DuplicateTitleSpec`: 重複タイトルチェック

#### 具体的な仕様例:
```typescript
export class PublishableContentSpec extends CompositeSpecification<Content> {
  isSatisfiedBy(content: Content): boolean {
    return content.status === "UNEXPORTED" 
      && content.markdown.length >= 100
      && content.title.length >= 5;
  }
}

export class EditableContentSpec extends CompositeSpecification<Content> {
  isSatisfiedBy(content: Content): boolean {
    return content.status === "UNEXPORTED";
  }
}
```

### 3.3 リポジトリでの仕様活用

#### タスク: 仕様対応リポジトリメソッドの追加
- **ファイル**: `src/domains/contents/types.ts`
- **変更内容**: `IContentsQueryRepository`に仕様ベースの検索メソッドを追加

#### タスク: リポジトリ実装の修正
- **ファイル**: `src/infrastructures/contents/repositories/contents-query-repository.ts`
- **内容**: 仕様を満たすコンテンツを検索するメソッドの実装

### 3.4 ドメインサービスでの仕様活用

#### タスク: ContentsDomainServiceの拡張
- **変更内容**:
  - 重複チェックを`DuplicateTitleSpec`で実装
  - その他のビジネスルール検証メソッドの追加

## 4. テストの追加・修正

### 4.1 ユニットテストの作成

#### タスク: ドメインイベントのテスト
- **ファイル**: `src/domains/contents/events/__tests__/content-created-event.test.ts`

#### タスク: 集約のテスト
- **ファイル**: `src/domains/contents/aggregates/__tests__/content-aggregate.test.ts`

#### タスク: 仕様のテスト
- **ファイル**: `src/domains/contents/specifications/__tests__/content-specifications.test.ts`

### 4.2 統合テストの修正

#### タスク: アプリケーションサービステストの修正
- **ファイル**: `src/application-services/contents/__tests__/add-contents.test.ts`
- **変更内容**: イベント発行の検証を追加

## 5. ドキュメントの更新

### 5.1 アーキテクチャドキュメント

#### タスク: DDD実装ガイドの作成
- **ファイル**: `docs/ddd-architecture.md`
- **内容**:
  - ドメインイベントの使用方法
  - 集約の設計原則
  - 仕様パターンの活用例

#### タスク: コードベース規約の更新
- **ファイル**: `CLAUDE.md`の更新
- **内容**: DDD関連の開発規約を追加

## 実装順序と優先度

### Phase 1 (高優先度)
1. ドメインイベント基盤の実装
2. ContentCreatedEventの実装と統合
3. 基本的な仕様パターンの導入

### Phase 2 (中優先度)
4. 集約ルートの実装
5. より複雑な仕様の追加
6. 既存コードのリファクタリング

### Phase 3 (低優先度)
7. テストの充実
8. ドキュメントの整備
9. パフォーマンス最適化

## 注意事項

- **段階的実装**: 既存機能を壊さないよう、段階的に実装する
- **後方互換性**: 既存のAPIとの互換性を保つ
- **テスト駆動**: 新機能はテストファーストで実装
- **コードレビュー**: 各フェーズでのコードレビューを必須とする
- **パフォーマンス**: イベント処理による性能影響を監視

## 期待される効果

1. **保守性の向上**: ビジネスロジックの明示化により、コード理解が容易
2. **拡張性の向上**: 新機能追加時の影響範囲を最小化
3. **テスタビリティの向上**: 各コンポーネントの独立テストが可能
4. **ビジネスとの対話改善**: ドメインモデルがビジネス言語を反映
5. **品質の向上**: 不変条件の保証により、バグの発生を抑制