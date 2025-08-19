# ドメインモデル図

このドキュメントは、`src/domains/` 配下で定義されているドメインモデルの構造と関係性を可視化しています。

## ドメイン概要

本システムは Clean Architecture に基づいて設計されており、以下の4つの主要ドメインを持っています：

- **Articles**: 記事管理（カテゴリー付き、OGメタデータ対応）
- **Books**: 書籍管理（ISBN、Google Books API連携）
- **Notes**: ノート管理（Markdown形式）
- **Images**: 画像管理（MinIO連携、サムネイル生成）

これらのドメインは共通の **Common** ドメインで定義された基本的な Value Objects を使用しています。

## エンティティ関係図

```mermaid
erDiagram
    %% Common Domain Value Objects
    Status {
        enum status "UNEXPORTED | EXPORTED"
    }
    
    Id {
        string id "UUID v7"
    }
    
    UserId {
        string userId "User identifier"
    }
    
    CreatedAt {
        date createdAt "Creation timestamp"
    }
    
    ExportedAt {
        date exportedAt "Export timestamp (nullable)"
    }

    %% Articles Domain
    Article {
        Id id PK
        UserId userId FK
        CategoryName categoryName
        Id categoryId FK
        ArticleTitle title
        Quote quote "nullable"
        Url url
        Status status
        OgTitle ogTitle "nullable"
        OgDescription ogDescription "nullable"
        CreatedAt createdAt
        ExportedAt exportedAt "nullable"
    }
    
    Category {
        Id id PK
        CategoryName name
        UserId userId FK
    }

    %% Books Domain
    Book {
        Id id PK
        UserId userId FK
        ISBN ISBN
        BookTitle title
        Status status
        GoogleTitle googleTitle "nullable"
        GoogleSubTitle googleSubTitle "nullable"
        GoogleAuthors googleAuthors "nullable"
        GoogleDescription googleDescription "nullable"
        GoogleImgSrc googleImgSrc "nullable"
        GoogleHref googleHref "nullable"
        BookMarkdown markdown "nullable"
        CreatedAt createdAt
        ExportedAt exportedAt "nullable"
    }

    %% Notes Domain
    Note {
        Id id PK
        UserId userId FK
        NoteTitle title
        Markdown markdown
        Status status
        CreatedAt createdAt
        ExportedAt exportedAt "nullable"
    }

    %% Images Domain
    Image {
        Id id PK
        UserId userId FK
        Path path
        ContentType contentType
        FileSize fileSize
        Pixel width "nullable"
        Pixel height "nullable"
        Tag tags "array, nullable"
        Description description "nullable"
        Status status
        CreatedAt createdAt
        ExportedAt exportedAt "nullable"
    }

    %% Relationships
    Article ||--o{ Category : "belongs to"
    Category ||--o{ Article : "has many"
```

## ドメイン境界とアーキテクチャ

```mermaid
graph TB
    subgraph "Common Domain"
        CommonEntity[Common Entity]
        IdGenerator[ID Generator Service]
        CommonTypes[Common Value Objects<br/>• Id<br/>• UserId<br/>• Status<br/>• CreatedAt<br/>• ExportedAt]
    end

    subgraph "Articles Domain"
        ArticleEntity[Article Entity]
        CategoryEntity[Category Entity]
        ArticleRepo[Article Repository Interface]
        CategoryRepo[Category Repository Interface]
        ArticleService[Articles Domain Service]
        ArticleTypes[Article Value Objects<br/>• ArticleTitle<br/>• CategoryName<br/>• Url<br/>• Quote<br/>• OgTitle<br/>• OgDescription]
    end

    subgraph "Books Domain"
        BookEntity[Book Entity]
        BookRepo[Books Repository Interface]
        BookService[Books Domain Service]
        BookTypes[Book Value Objects<br/>• ISBN<br/>• BookTitle<br/>• GoogleTitle<br/>• GoogleSubTitle<br/>• GoogleAuthors<br/>• GoogleDescription<br/>• GoogleImgSrc<br/>• GoogleHref<br/>• BookMarkdown]
    end

    subgraph "Notes Domain"
        NoteEntity[Note Entity]
        NoteRepo[Notes Repository Interface]
        NoteService[Notes Domain Service]
        NoteTypes[Note Value Objects<br/>• NoteTitle<br/>• Markdown]
    end

    subgraph "Images Domain"
        ImageEntity[Image Entity]
        ImageRepo[Images Repository Interface]
        ImageTypes[Image Value Objects<br/>• Path<br/>• ContentType<br/>• FileSize<br/>• Pixel<br/>• Tag<br/>• Description<br/>• OriginalBuffer<br/>• ThumbnailBuffer]
    end

    %% Dependencies (all domains depend on Common)
    ArticleEntity --> CommonTypes
    BookEntity --> CommonTypes
    NoteEntity --> CommonTypes
    ImageEntity --> CommonTypes
    
    ArticleEntity --> IdGenerator
    BookEntity --> IdGenerator
    NoteEntity --> IdGenerator
    ImageEntity --> IdGenerator

    ArticleService --> ArticleRepo
    BookService --> BookRepo
    NoteService --> NoteRepo
```

## ドメインサービスの責務

```mermaid
graph LR
    subgraph "Domain Services"
        ArticlesDomainService[Articles Domain Service<br/>• 重複URL検証]
        BooksDomainService[Books Domain Service<br/>• 重複ISBN検証]
        NotesDomainService[Notes Domain Service<br/>• 重複タイトル検証]
        IdGeneratorService[ID Generator Service<br/>• UUID v7生成]
    end

    subgraph "Repository Interfaces"
        ArticlesRepo[Articles Repository<br/>• findByUrl<br/>• create<br/>• deleteById]
        BooksRepo[Books Repository<br/>• findByISBN<br/>• create<br/>• deleteById]
        NotesRepo[Notes Repository<br/>• findByTitle<br/>• create<br/>• deleteById]
        ImagesRepo[Images Repository<br/>• create<br/>• deleteById]
    end

    ArticlesDomainService --> ArticlesRepo
    BooksDomainService --> BooksRepo
    NotesDomainService --> NotesRepo
```

## 共通ライフサイクル

全てのエンティティは共通のステータスライフサイクルを持ちます：

```mermaid
stateDiagram-v2
    [*] --> UNEXPORTED : create()<br/>createdAt設定
    UNEXPORTED --> EXPORTED : export<br/>exportedAt設定
    EXPORTED --> [*] : delete
    
    note right of UNEXPORTED
        新規作成時の初期状態
        ユーザーが編集可能
        createdAt: 作成日時
        exportedAt: null
    end note
    
    note right of EXPORTED
        エクスポート済み
        読み取り専用
        exportedAt: エクスポート日時
    end note
```

## 特徴

### Value Objects の活用
- 全ての値は適切に型付けされた Value Objects として定義
- Zod を使用した実行時バリデーション
- Brand Types による型安全性の確保

### Repository パターン
- 各ドメインに Command と Query の Repository インターフェースを分離
- 依存性逆転の原則に従った設計

### ドメインサービス
- 複雑なビジネスロジック（重複チェック等）をドメインサービスに配置
- 各ドメインの固有ルールを適切にカプセル化

### エンティティファクトリー
- エンティティの生成ロジックをファクトリーメソッドとして実装
- 不正な状態のオブジェクト生成を防止