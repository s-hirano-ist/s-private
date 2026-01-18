# ドメインモデル図

このドキュメントは、`packages/core/` 配下で定義されているドメインモデルの構造と関係性を可視化しています。

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
        literal UNEXPORTED "初期状態"
        literal LAST_UPDATED "バッチ処理中"
        object EXPORTED "{ status: EXPORTED, exportedAt: Date }"
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
        ArticleTitle title
        Quote quote "nullable"
        Url url
        Status status
        OgTitle ogTitle "nullable"
        OgDescription ogDescription "nullable"
        OgImageUrl ogImageUrl "nullable"
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
    Category ||--o{ Article : "has many"
```

## ドメイン境界とアーキテクチャ

```mermaid
graph TB
    subgraph "Common Domain"
        IdGenerator[ID Generator Service]
        CommonTypes[Common Value Objects<br/>Id, UserId, Status, CreatedAt, ExportedAt]
    end

    subgraph "Articles Domain"
        ArticleEntity[Article / Category]
        ArticleRepo[Repository Interfaces]
        ArticleService[Domain Service<br/>重複URL検証]
    end

    subgraph "Books Domain"
        BookEntity[Book]
        BookRepo[Repository Interfaces]
        BookService[Domain Service<br/>重複ISBN検証]
    end

    subgraph "Notes Domain"
        NoteEntity[Note]
        NoteRepo[Repository Interfaces]
        NoteService[Domain Service<br/>重複タイトル検証]
    end

    subgraph "Images Domain"
        ImageEntity[Image]
        ImageRepo[Repository Interfaces]
    end

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

### ドメインサービスの責務

| ドメインサービス | 主な責務 | 使用するリポジトリメソッド |
|-----------------|---------|------------------------|
| ArticlesDomainService | 重複URL検証 | findByUrl |
| BooksDomainService | 重複ISBN検証 | findByISBN |
| NotesDomainService | 重複タイトル検証 | findByTitle |
| IdGeneratorService | UUID v7生成 | - |

## 共通ライフサイクル

全てのエンティティは共通のステータスライフサイクルを持ちます：

```mermaid
stateDiagram-v2
    [*] --> UNEXPORTED : create()
    UNEXPORTED --> LAST_UPDATED : バッチ処理開始
    LAST_UPDATED --> EXPORTED : バッチ処理完了
    LAST_UPDATED --> UNEXPORTED : revert
    EXPORTED --> [*] : delete
```

- **UNEXPORTED**: 新規作成時の初期状態。ユーザーが編集可能。`exportedAt: null`
- **LAST_UPDATED**: バッチ処理中の中間状態。エクスポート待ち
- **EXPORTED**: エクスポート済み。読み取り専用。`exportedAt`にエクスポート日時が設定される

## 集約（Aggregate）境界

DDDにおける集約は、データ変更のための整合性境界を定義します。

```mermaid
graph TB
    subgraph "Articles Aggregate"
        ArticleRoot["📦 Article<br/>(集約ルート)"]
        ArticleCategory["Category<br/>(参照のみ)"]
        ArticleRoot -.->|"categoryId参照"| ArticleCategory
    end

    subgraph "Other Aggregates"
        BookRoot["📦 Book"]
        NoteRoot["📦 Note"]
        ImageRoot["📦 Image"]
    end

    style ArticleRoot fill:#e1f5fe
    style BookRoot fill:#e1f5fe
    style NoteRoot fill:#e1f5fe
    style ImageRoot fill:#e1f5fe
    style ArticleCategory fill:#fff9c4
```

### 集約の詳細と不変条件

| 集約 | 集約ルート | 不変条件 | 検証サービス |
|------|-----------|----------|-------------|
| **Articles** | Article | URLはユーザーごとに一意 | `ArticlesDomainService.ensureNoDuplicate` |
| **Books** | Book | ISBNはユーザーごとに一意 | `BooksDomainService.ensureNoDuplicate` |
| **Notes** | Note | タイトルはユーザーごとに一意 | `NotesDomainService.ensureNoDuplicate` |
| **Images** | Image | パスはユーザーごとに一意 | `ImagesDomainService.ensureNoDuplicate` |

全集約共通: ステータス遷移は UNEXPORTED → LAST_UPDATED → EXPORTED

> **コードリファレンス**: 各集約ルートはコード内のJSDocでも明示的に文書化されています。
> - `packages/core/articles/entities/article-entity.ts` - `articleEntity`
> - `packages/core/books/entities/books-entity.ts` - `bookEntity`
> - `packages/core/notes/entities/note-entity.ts` - `noteEntity`
> - `packages/core/images/entities/image-entity.ts` - `imageEntity`

### 設計上の考慮事項

- **Categoryの位置付け**: Articleはドメイン層で`categoryName`（値オブジェクト）を保持し、インフラ層で`categoryId`（FK）として永続化。`connectOrCreate`パターンで管理
- **トランザクション境界**: 各集約は独立してトランザクション整合性を保証
- **リポジトリの責任**: 各集約ルートに対して1つのCommand/Queryリポジトリペアを定義

## Application Service層

Application Service層は、ドメインロジックとインフラストラクチャ層をつなぐ役割を担います。認証・認可とビジネスロジックを分離した設計になっています。

### ファイル構成パターン

```
app/src/application-services/{domain}/
├── {action}.deps.ts    ← 依存の型定義とデフォルト値
├── {action}.core.ts    ← Core関数（ビジネスロジック、"use server"なし）
├── {action}.ts         ← Server Action wrapper（認証・認可のみ）
└── {action}.test.ts    ← テスト（Core関数を直接テスト）
```

| ファイル | 責務 | "use server" |
|---------|------|-------------|
| `*.deps.ts` | 依存の型定義（Repository, Domain Service Factory）とデフォルト値 | なし |
| `*.core.ts` | ビジネスロジック（フォームパース、ドメイン検証、永続化、キャッシュ無効化） | なし |
| `*.ts` | Server Action（認証・認可チェック後にCoreを呼び出し） | あり |
| `*.test.ts` | Core関数のユニットテスト（モック依存注入） | なし |

### 設計原則

```typescript
// add-article.ts (Server Action) - 認証・認可のみ
"use server";
export async function addArticle(formData: FormData): Promise<ServerAction> {
  const hasPermission = await hasDumperPostPermission();
  if (!hasPermission) forbidden();
  return addArticleCore(formData, defaultAddArticleDeps);
}

// add-article.core.ts (Core関数) - ビジネスロジック
import "server-only";
export async function addArticleCore(formData: FormData, deps: AddArticleDeps): Promise<ServerAction> {
  // フォームパース、重複チェック、エンティティ作成、永続化
}
```

**セキュリティ**: Core関数は`"use server"`の外に配置し、`import "server-only"`でクライアント側インポートを防止。クライアントからはServer Actionのみ呼び出し可能。

**テスタビリティ**: Core関数は依存性注入（DI）で設計。テスト時にモック依存を注入可能。

### アーキテクチャ図

```mermaid
graph TB
    subgraph "Client"
        ClientComponent[React Component]
    end

    subgraph "Server Action Layer"
        SA["Server Action<br/>(認証・認可)"]
    end

    subgraph "Core Layer"
        Core["Core Function<br/>(ビジネスロジック)"]
    end

    subgraph "Dependencies"
        Repo[Command Repository]
        DSF[Domain Service Factory]
    end

    subgraph "Domain Layer"
        DS[Domain Service]
        Entity[Entity Factory]
    end

    ClientComponent -->|"呼び出し可能"| SA
    ClientComponent -.->|"呼び出し不可<br/>(server-only)"| Core
    SA -->|"権限チェック後"| Core
    Core --> Repo
    Core --> DSF
    Core --> DS
    Core --> Entity

    style SA fill:#e3f2fd
    style Core fill:#fff3e0
    style ClientComponent fill:#e8f5e9
```

## 設計の特徴

- **Value Objects**: 全ての値は適切に型付けされた Value Objects として定義。Zodによる実行時バリデーションとBrand Typesによる型安全性
- **Repositoryパターン**: 各ドメインにCommand/Queryリポジトリを分離。依存性逆転の原則に従った設計
- **ドメインサービス**: 複雑なビジネスロジック（重複チェック等）を配置し、各ドメインの固有ルールをカプセル化
- **エンティティファクトリー**: エンティティの生成ロジックをファクトリーメソッドとして実装し、不正な状態のオブジェクト生成を防止

## DDDからの意図的な逸脱

このドキュメントでは、DDDの原則から意図的に外れる設計判断とその理由を記載します。

### 001: 状態遷移ルールがバッチサービスに存在する

#### 概要

状態遷移ロジック（`UNEXPORTED → LAST_UPDATED → EXPORTED`）がエンティティ外のバッチサービスに存在しています。

#### DDDの原則との乖離

- 状態遷移ルールがエンティティ外に存在
- 不正な状態遷移を型レベルで防げない
- DDDの原則（エンティティがビジネスルールを持つ）に反する

#### 対応しない理由

**パフォーマンス優先**: バッチ処理で `updateMany` による一括ステータス更新を行いたいため。

エンティティに状態遷移メソッドを追加すると、各レコードを個別に取得・更新する必要があり、大量データのバッチ処理で著しいパフォーマンス低下を招きます。

#### 対象ファイル

- `packages/core/articles/services/articles-batch-domain-service.ts`
- `packages/core/notes/services/notes-batch-domain-service.ts`
- `packages/core/books/services/books-batch-domain-service.ts`
- `packages/core/images/services/images-batch-domain-service.ts`

#### リスク軽減策

- バッチサービス内に状態遷移ロジックをコメントで明記
- 状態遷移を行うメソッドをバッチサービスに集約し、分散を防ぐ
