# ドメイン駆動設計（DDD）モデリングレビュー

## プロジェクト概要
本プロジェクトはコンテンツ管理システムで、以下のドメインを持つ：
- **Books Domain** - 書籍コンテンツ管理（ISBN検証、Google Books連携）
- **Contents Domain** - マークダウンベースのコンテンツ管理
- **Images Domain** - 画像アップロード・サムネイル生成・ストレージ管理
- **News Domain** - ニュース記事管理（カテゴリ・URL検証）
- **Common Domain** - 共有ドメイン要素

## ✅ 優れている点

### 1. 戦術的DDDパターンの実装
- **リポジトリパターン**: インターフェースと実装の適切な分離
- **値オブジェクト**: Zodスキーマによる型安全な値オブジェクト
- **境界コンテキスト**: ドメイン間の適切な分離
- **依存性逆転**: ドメインサービスがリポジトリインターフェースに依存

### 2. 強固なアーキテクチャ基盤
```typescript
// 適切なリポジトリパターンの例
export type IBooksCommandRepository = {
  create(data: BooksFormSchema): Promise<void>;
  deleteById(id: string, userId: string, status: Status): Promise<void>;
};
```

### 3. 効果的な値オブジェクト
- `idSchema` - UUID v7生成とデフォルト値
- `statusSchema` - コンテンツライフサイクル（UNEXPORTED → EXPORTED）
- ドメイン固有の検証（ISBN形式、URL検証、カテゴリ名）

## ❌ 主要な問題点

### 1. 貧血ドメインモデル（Anemic Domain Model）
**問題**: エンティティがデータコンテナに過ぎず、ビジネスロジックを持たない

**現状例**:
```typescript
// src/domains/news/services/news-domain-service.ts
export class NewsDomainService {
  public async prepareNewNews(formData: FormData, userId: string): Promise<NewsFormSchema> {
    // ビジネスロジックがサービス層に集中
    const exists = await this.newsQueryRepository.findByUrl(url, userId);
    if (exists !== null) throw new DuplicateError();
  }
}
```

**改善案**: エンティティにビジネスロジックを移動
```typescript
class NewsEntity {
  constructor(private props: NewsProps) {}
  
  public async checkDuplicate(repository: INewsQueryRepository): Promise<void> {
    const exists = await repository.findByUrl(this.props.url, this.props.userId);
    if (exists !== null) throw new DuplicateError();
  }
  
  public export(): void {
    if (this.props.status !== Status.UNEXPORTED) {
      throw new InvalidStatusTransitionError();
    }
    this.props.status = Status.EXPORTED;
  }
}
```

### 2. 集約（Aggregate）の欠如
**問題**: 集約ルートパターンが未実装で、トランザクション境界が不明確

**現状**: エンティティが独立して扱われている

**改善案**: 集約ルートの導入
```typescript
class NewsAggregate {
  constructor(
    private news: NewsEntity,
    private category: CategoryValueObject
  ) {}
  
  public static create(data: NewsCreateData): NewsAggregate {
    // 不変条件の検証
    // ファクトリーロジック
  }
  
  public changeCategory(newCategory: CategoryValueObject): void {
    // ビジネスルールの検証
    this.category = newCategory;
  }
}
```

### 3. ドメインイベントの不在
**問題**: イベント駆動アーキテクチャが未実装

**改善案**: ドメインイベントの実装
```typescript
abstract class DomainEvent {
  abstract eventName: string;
  abstract occurredOn: Date;
}

class NewsCreatedEvent extends DomainEvent {
  eventName = 'NewsCreated';
  occurredOn = new Date();
  
  constructor(public readonly newsId: string, public readonly userId: string) {
    super();
  }
}

class NewsEntity {
  private events: DomainEvent[] = [];
  
  public create(): void {
    // ビジネスロジック
    this.addEvent(new NewsCreatedEvent(this.id, this.userId));
  }
  
  public getEvents(): DomainEvent[] {
    return [...this.events];
  }
  
  public clearEvents(): void {
    this.events = [];
  }
}
```

## ⚠️ 改善が必要な領域

### 1. ドメインサービスの責務過多
**問題**: フォーム解析（インフラ関心事）とビジネスロジックが混在

**現状**:
```typescript
public async prepareNewNews(formData: FormData, userId: string) {
  const formValues = {
    title: formData.get("title") as string, // インフラ関心事
    // ...
  };
  // ビジネスロジック
}
```

**改善案**: 責務の分離
```typescript
// アプリケーションサービス層
class NewsApplicationService {
  public async createNews(formData: FormData, userId: string) {
    const command = this.formParser.parse(formData); // インフラ
    const news = await this.newsDomainService.createNews(command, userId); // ドメイン
  }
}
```

### 2. リポジトリクエリメソッドの抽象化レベル
**問題**: プリミティブ型を返すクエリメソッドが存在

**改善案**: ドメインオブジェクトの返却
```typescript
// 現状
findByUrl(url: string, userId: string): Promise<string | null>

// 改善案
findByUrl(url: string, userId: string): Promise<NewsEntity | null>
```

## 📊 DDD成熟度評価

### 現在のレベル: **中級（Intermediate）**

**優秀な実装領域**:
- ✅ リポジトリパターン（教科書的実装）
- ✅ 値オブジェクト（Zodによる強固な検証）
- ✅ 境界の強制（分離されたフィーチャー）
- ✅ インフラの分離（適切な依存性逆転）
- ✅ 型安全性（エンドツーエンドTypeScript）

**欠落しているDDD要素**:
- ❌ リッチドメインモデル（エンティティは主にデータコンテナ）
- ❌ 集約（集約ルートパターンや一貫性境界なし）
- ❌ ドメインイベント（イベント駆動アーキテクチャなし）
- ❌ 複雑なビジネスロジック（洗練されたビジネスルールの制限）

## 🎯 改善優先度

### 高優先度
1. **リッチドメインモデルの実装** - エンティティにビジネスロジックを移動
2. **集約パターンの導入** - トランザクション境界の明確化

### 中優先度
3. **ドメインイベントの実装** - イベント駆動アーキテクチャの導入
4. **ドメインサービスの責務整理** - インフラ関心事の分離

### 低優先度
5. **ファクトリーパターンの活用** - エンティティ生成ロジックの集約
6. **仕様パターンの導入** - 複雑なビジネスルールの表現

## 📝 結論

本プロジェクトは**実用的な保守性**を**理論的なDDDの純粋性**よりも優先した設計となっており、コンテンツ管理システムのような比較的シンプルなドメインロジックには適している。しかし、より複雑なビジネスシナリオに対応するためには、リッチドメインモデリングの導入が望ましい。

戦術的DDDパターン（リポジトリ、ドメインサービス、値オブジェクト）は堅実に実装されているが、戦略的DDDパターン（集約、ドメインイベント、複雑なビジネスロジック）の導入により、より表現力豊かで拡張性の高いドメインモデルを実現できる。


│ │                                                                                                                                                                                                                                                           │ │
│ │ 3. コンポーネント構成の最適化（オプション）                                                                                                                                                                                                               │ │
│ │                                                                                                                                                                                                                                                           │ │
│ │ /src/components/                                                                                                                                                                                                                                          │ │
│ │ ├── features/    # 機能単位のコンポーネント構成│ │
│ │ ├── domains/     # ドメイン固有コンポーネント│ │
│ │ └── common/      # 共通UIコンポーネント│ │
│ │                                                                                                                                                                                                                                                           │ │
│ │ 4. 型定義の整理│ │
│ ││ │
│ │ - 共有型を/src/common/types/に集約│ │
│ │ - ドメイン固有の型は各ドメインディレクトリに保持
