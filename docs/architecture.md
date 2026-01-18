# アーキテクチャ

## クリーンアーキテクチャの構成

本コードベースはドメイン駆動設計に基づくクリーンアーキテクチャを採用しています。

### ドメイン層 (`packages/core/`)
- `entities/` - コアビジネスロジックとドメインエンティティ
- `repositories/` - リポジトリインターフェース（依存性の逆転）
- `services/` - 複雑なビジネスロジックのためのドメインサービス
- `types/` - ドメイン固有の型と定数

### アプリケーションサービス層 (`app/src/application-services/`)
- ドメイン操作とユースケースのオーケストレーション
- フォームデータのパースとバリデーション処理
- 各ドメインに専用のアプリケーションサービスを配置

### インフラストラクチャ層 (`app/src/infrastructures/`)
- リポジトリ実装（Prisma ORM）
- 外部サービス連携（認証、i18n、監視）
- 技術的関心事（MinIO、ロギング、モニタリング）

#### インフラストラクチャサービス（アダプター）

インフラストラクチャサービスは、特定の技術を使用してドメインインターフェースを実装します。これらはドメイン層を外部システムに接続する**アダプター**です。

| ディレクトリ | サービス | インターフェース | 技術 |
|-----------|---------|-----------|------------|
| `common/services/` | `minioStorageService` | `IStorageService` | MinIOクライアント |
| `books/services/` | `booksStorageService` | `IStorageService` | MinIO（booksパス） |
| `images/services/` | `sharpImageProcessor` | `IImageProcessor` | Sharpライブラリ |

**命名規則:**
- 実装が特定の技術に固有の場合は技術ベースの命名を使用（例：`minio-*`、`sharp-*`）
- アダプターがドメイン固有の設定を持つ場合はドメインベースの命名を使用（例：`books-storage-service`はbook固有のパスを使用）

#### ドメインサービスファクトリ

ドメインサービスは`app/src/infrastructures/factories/`の`domainServiceFactory`を通じてインスタンス化されます。

```typescript
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";

const articlesDomainService = domainServiceFactory.createArticlesDomainService();
```

これにより依存性注入が一元化され、モック実装によるテストが簡素化されます。

## ドメインモデル

ドメインモデルの詳細（エンティティ、ステータスライフサイクル、集約境界、Application Service層）については [docs/domain-model.md](domain-model.md) を参照してください。

スキーマは `packages/database/prisma/schema.prisma` で管理されています。

## コードスタイルとアーキテクチャルール

### フォーマッターとリンター
- **主要フォーマッター**: Biome（Prettierではない）- `pnpm check:fix`を使用
  - インポート整理、コードスタイル強制、TypeScript固有のルールを含む
  - 厳格なスタイルルールとアクセシビリティチェックを設定
- **補助リンター**: React/Next.js固有ルール用のESLint
  - Reactフックの強制を含むTypeScript厳格設定
  - フレームワーク固有のベストプラクティス用Next.jsプラグイン統合

### アーキテクチャルール
- **パッケージマネージャー**: pnpm（必須）
- **インポートルール**: 上位ディレクトリへの相対インポート禁止（`../../*`）- 絶対インポートを使用
- **ドメイン境界**: クロスドメインインポート禁止 - 各ドメインは独立
- **コンポーネント規則**: TypeScriptインターフェースは`type`として定義（`interface`ではない）、Reactフックルールを強制
- **依存関係管理**: 循環依存検出用にdependency cruiserを設定

### コアパッケージのインポートパターン

`@s-hirano-ist/s-core`パッケージは2つのインポートスタイルをサポートしています。

**1. バレルインポート（ほとんどのユースケースで推奨）**
```typescript
import { ArticlesDomainService, makeUrl, Url } from "@s-hirano-ist/s-core/articles";
import { makeUserId, makeId } from "@s-hirano-ist/s-core/common";
```

**2. ディープパスインポート（特定モジュール用）**
```typescript
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import type { IArticlesQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
```

コードをすっきりさせるにはバレルインポートを使用し、特定の型インポートが必要な場合やバンドルサイズを最小化したい場合はディープパスを使用してください。

### 設定ファイル
- `biome.json` - 主要フォーマッター/リンター設定
- `eslint.config.ts` - React/Next.js用補助ESLint設定
- `.dependency-cruiser.cjs` - アーキテクチャ境界の強制

## セキュリティ

### 自動依存関係管理（Renovate）
- **スケジュール**: 週次更新（月曜日11時（JST）前）
- **脆弱性アラート**: セキュリティ問題の自動PR（`security`ラベル付き）
- **サプライチェーン保護**: パッチ/マイナーの最小リリース経過時間3日（72時間）、グローバル最小24時間
- **設定**: [.github/renovate.json5](../.github/renovate.json5)を参照

### npm/pnpmセキュリティ設定
- **バージョン固定**: .npmrcの`save-exact=true` + pnpm-workspace.yamlの`savePrefix: ''`
- **ライフサイクルスクリプト保護**: `ignore-dep-scripts=true`で悪意のあるスクリプトを防止
- **CI/CD**: 全CIワークフローで`--frozen-lockfile`を強制
- **最小リリース経過時間**: 新規公開された悪意のあるパッケージを避けるための24時間グローバル設定

完全なセキュリティベストプラクティスについては[SECURITY.md](../SECURITY.md)を参照してください。

## Loader Pattern

Suspense境界内でデータフェッチを実行し、取得データをプレゼンテーションコンポーネントに渡すパターン。

### ディレクトリ構成

```
app/src/loaders/
├── types.ts                # 共通型定義
└── [domain]/
    ├── index.ts            # 再エクスポート
    └── *-loader.tsx        # Loader実装
```

### 命名規則

| パターン | 例 |
|---------|-----|
| ファイル | `{component}-loader.tsx` |
| 関数 | `{Component}Loader` |
| Props | `{Component}LoaderProps` |

### 実装例

```typescript
// app/src/loaders/articles/articles-stack-loader.tsx
import "server-only";
import { getExportedArticles } from "@/application-services/articles/get-articles";
import { ArticlesStack } from "@/components/articles/server/articles-stack";
import type { PaginatedLinkCardLoaderProps } from "@/loaders/types";

export type ArticlesStackLoaderProps = PaginatedLinkCardLoaderProps & {
  variant: "exported" | "unexported";
};

export async function ArticlesStackLoader({
  variant,
  deleteAction,
  loadMoreAction,
}: ArticlesStackLoaderProps) {
  const getData = variant === "exported" ? getExportedArticles : getUnexportedArticles;
  const initialData = await getData(0);

  return (
    <ArticlesStack
      deleteAction={deleteAction}
      initialData={initialData}
      loadMoreAction={loadMoreAction}
    />
  );
}
```

### ページでの使用

```typescript
<Suspense fallback={<Loading />}>
  <ErrorPermissionBoundary
    errorCaller="ArticlesStack"
    permissionCheck={hasViewerAdminPermission}
    render={() => (
      <ArticlesStackLoader
        variant="exported"
        loadMoreAction={loadMoreExportedArticles}
      />
    )}
  />
</Suspense>
```

### 責務の分離

| レイヤー | 責務 |
|---------|------|
| Application Services | キャッシュ、データ変換 |
| Loaders | データ取得の実行、Suspense連携 |
| Server Components | プレゼンテーション |
| Client Components | インタラクティブ機能 |

**エラーハンドリング**: Loader内ではエラーをcatchせず、ErrorBoundaryに伝播させる。

## Server Actions Architecture Pattern

Server Actionsを3層分離構造（action/core/deps）で実装し、テスタビリティと認証責務の分離を実現するパターン。

### ディレクトリ構成

```
app/src/application-services/
└── [domain]/
    ├── add-{domain}.ts         # Server Action（認証・認可）
    ├── add-{domain}.core.ts    # ビジネスロジック
    └── add-{domain}.deps.ts    # 依存性定義
```

### 命名規則

| パターン | 例 |
|---------|-----|
| Action ファイル | `add-article.ts` |
| Core ファイル | `add-article.core.ts` |
| Deps ファイル | `add-article.deps.ts` |
| Action 関数 | `addArticle` |
| Core 関数 | `addArticleCore` |
| Deps 型 | `AddArticleDeps` |
| デフォルト依存 | `defaultAddArticleDeps` |

### 実装例

```typescript
// app/src/application-services/articles/add-article.ts
"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { addArticleCore } from "./add-article.core";
import { defaultAddArticleDeps } from "./add-article.deps";

export async function addArticle(formData: FormData): Promise<ServerAction> {
  const hasPermission = await hasDumperPostPermission();
  if (!hasPermission) forbidden();

  return addArticleCore(formData, defaultAddArticleDeps);
}
```

```typescript
// app/src/application-services/articles/add-article.core.ts
import "server-only";
import type { ServerAction } from "@/common/types";
import type { AddArticleDeps } from "./add-article.deps";

export async function addArticleCore(
  formData: FormData,
  deps: AddArticleDeps,
): Promise<ServerAction> {
  const { commandRepository, domainServiceFactory, eventDispatcher } = deps;

  try {
    // 1. Form data parsing
    // 2. Domain validation
    // 3. Entity creation
    // 4. Persistence
    // 5. Event dispatch
    // 6. Cache invalidation
    return { success: true, message: "inserted" };
  } catch (error) {
    return await wrapServerSideErrorForClient(error, formData);
  }
}
```

```typescript
// app/src/application-services/articles/add-article.deps.ts
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";

export type AddArticleDeps = {
  commandRepository: IArticlesCommandRepository;
  domainServiceFactory: ReturnType<typeof createDomainServiceFactory>;
  eventDispatcher: IEventDispatcher;
};

export const defaultAddArticleDeps: AddArticleDeps = {
  commandRepository: articlesCommandRepository,
  domainServiceFactory: domainServiceFactory,
  eventDispatcher: eventDispatcher,
};
```

### 責務の分離

| レイヤー | ファイル | 責務 |
|---------|---------|------|
| Action | `add-*.ts` | 認証・認可、`"use server"`ディレクティブ |
| Core | `add-*.core.ts` | ビジネスロジック、エラーハンドリング |
| Deps | `add-*.deps.ts` | 依存性の型定義とデフォルト実装 |

**注意**: `"use server"`ファイルからは非同期関数のみエクスポート可能なため、deps は分離が必要。

## Value Object Pattern with Zod Branding

Zodスキーマとbranded型を使用した型安全な値オブジェクト。

### 命名規則

| パターン | 例 |
|---------|-----|
| Schema 定数 | `CategoryName` |
| 型 | `type CategoryName = z.infer<typeof CategoryName>` |
| Factory 関数 | `makeCategoryName` |

### 実装例

```typescript
// packages/core/articles/entities/article-entity.ts
import { z } from "zod";

// Schema定義
export const CategoryName = z
  .string({ message: "required" })
  .trim()
  .min(1, { message: "required" })
  .max(16, { message: "tooLong" })
  .brand<"CategoryName">();

// 型定義
export type CategoryName = z.infer<typeof CategoryName>;

// Factory関数
export const makeCategoryName = (v: string): CategoryName =>
  CategoryName.parse(v);
```

```typescript
// packages/core/common/entities/common-entity.ts
export const UserId = z.string().min(1, "required").brand<"UserId">();
export type UserId = z.infer<typeof UserId>;
export const makeUserId = (v: string): UserId => UserId.parse(v);
```

### 使用例

```typescript
// Value Objectの作成（バリデーション実行）
const categoryName = makeCategoryName("Technology"); // 成功
const invalidName = makeCategoryName(""); // ZodError: required

// 型安全：branded型により異なるValue Object間の混同を防止
function createArticle(title: ArticleTitle, category: CategoryName) { ... }
createArticle(categoryName, title); // コンパイルエラー
```

### バリデーションエラーハンドリング

バリデーションエラーは`ZodError`としてスローされ、`wrapServerSideErrorForClient`で`InvalidFormatError`に変換される。

## Domain Entity Creation Pattern

エンティティ生成時に`[entity, event]`タプルを返すパターン。

### 実装例

```typescript
// packages/core/articles/entities/article-entity.ts
import { createEntityWithErrorHandling } from "../../common/services/entity-factory.js";
import { ArticleCreatedEvent } from "../events/article-created-event.js";

export type ArticleWithEvent = readonly [UnexportedArticle, ArticleCreatedEvent];

export const articleEntity = {
  create: (args: CreateArticleArgs): ArticleWithEvent => {
    const { caller, ...entityArgs } = args;

    // エンティティ作成（Object.freezeで不変性を保証）
    const article = createEntityWithErrorHandling(() =>
      Object.freeze({
        id: makeId(),
        status: "UNEXPORTED",
        createdAt: makeCreatedAt(),
        ...entityArgs,
      }),
    );

    // ドメインイベント作成
    const event = new ArticleCreatedEvent({
      title: article.title as string,
      url: article.url as string,
      quote: (article.quote as string) ?? "",
      categoryName: article.categoryName as string,
      userId: article.userId as string,
      caller,
    });

    return [article, event] as const;
  },
};
```

```typescript
// packages/core/common/services/entity-factory.ts
export const createEntityWithErrorHandling = <T>(factory: () => T): T => {
  try {
    return factory();
  } catch (error) {
    if (error instanceof ZodError) throw new InvalidFormatError();
    throw new UnexpectedError();
  }
};
```

### 使用例

```typescript
// エンティティとイベントを同時に取得
const [article, event] = articleEntity.create({
  title: makeArticleTitle("記事タイトル"),
  url: makeUrl("https://example.com"),
  categoryName: makeCategoryName("Tech"),
  userId: makeUserId("user-123"),
  caller: "addArticle",
});

// 永続化とイベントディスパッチ
await commandRepository.create(article);
await eventDispatcher.dispatch(event);
```

### 注意事項

- `Object.freeze()`によりエンティティの不変性を保証
- `createEntityWithErrorHandling`でZodエラーをドメインエラーに変換
- イベントはエンティティ作成時に同時生成し、永続化後にディスパッチ

## Server-Side Error Handling Pattern

エラーをクライアント安全な`ServerAction`レスポンスに変換するパターン。

### 実装例

```typescript
// app/src/common/error/error-wrapper.ts
export async function wrapServerSideErrorForClient(
  error: unknown,
  formData?: FormData,
): Promise<ServerAction> {
  if (error instanceof DuplicateError) {
    await eventDispatcher.dispatch(new SystemWarningEvent({ ... }));
    return { success: false, message: "duplicated", formData: ... };
  }

  if (error instanceof InvalidFormatError) {
    await eventDispatcher.dispatch(new SystemWarningEvent({ ... }));
    return { success: false, message: error.message, formData: ... };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    await eventDispatcher.dispatch(new SystemErrorEvent({ ... }));
    return { success: false, message: "prismaUnexpected" };
  }

  // その他のエラー
  await eventDispatcher.dispatch(new SystemErrorEvent({ ... }));
  return { success: false, message: "unexpected" };
}
```

```typescript
// app/src/common/error/error-classes.ts
export class UnexpectedError extends Error {
  constructor() { super("unexpected"); this.name = "UnexpectedError"; }
}

export class InvalidFormatError extends Error {
  constructor() { super("invalidFormat"); this.name = "InvalidFormatError"; }
}

export class DuplicateError extends Error {
  constructor() { super("duplicate"); this.name = "DuplicateError"; }
}

export class FileNotAllowedError extends Error {
  constructor() { super("invalidFileFormat"); this.name = "FileNotAllowedError"; }
}
```

### エラータイプ別処理

| エラータイプ | レスポンス message | イベント | ステータス |
|-------------|-------------------|---------|-----------|
| `DuplicateError` | `"duplicated"` | SystemWarningEvent | 400 |
| `InvalidFormatError` | `"invalidFormat"` | SystemWarningEvent | 500 |
| `FileNotAllowedError` | `"invalidFileFormat"` | SystemWarningEvent | 500 |
| `AuthError` | `"signInUnknown"` | SystemWarningEvent | 401 |
| Prisma errors | `"prismaUnexpected"` | SystemErrorEvent | 500 |
| その他 | `"unexpected"` | SystemErrorEvent | 500 |

### 使用例

```typescript
// add-article.core.ts
try {
  // ビジネスロジック
  return { success: true, message: "inserted" };
} catch (error) {
  return await wrapServerSideErrorForClient(error, formData);
}
```

## Form Data Parsing Pattern

FormDataをドメイン値オブジェクトに変換するパターン。

### ディレクトリ構成

```
app/src/application-services/
└── [domain]/
    └── helpers/
        └── form-data-parser.ts
```

### 命名規則

| パターン | 例 |
|---------|-----|
| パーサー関数 | `parseAdd{Domain}FormData` |
| ファイル | `helpers/form-data-parser.ts` |

### 実装例

```typescript
// app/src/application-services/articles/helpers/form-data-parser.ts
import {
  makeArticleTitle,
  makeCategoryName,
  makeQuote,
  makeUrl,
} from "@s-hirano-ist/s-core/articles/entities/article-entity";
import type { UserId } from "@s-hirano-ist/s-core/common/entities/common-entity";
import { getFormDataString } from "@/common/utils/form-data-utils";

export const parseAddArticleFormData = (formData: FormData, userId: UserId) => {
  const title = getFormDataString(formData, "title");
  const quote = getFormDataString(formData, "quote");
  const url = getFormDataString(formData, "url");
  const categoryName = getFormDataString(formData, "category");

  return {
    title: makeArticleTitle(title),
    quote: makeQuote(quote),
    url: makeUrl(url),
    categoryName: makeCategoryName(categoryName),
    userId,
  };
};
```

### 使用例

```typescript
// add-article.core.ts
export async function addArticleCore(formData: FormData, deps: AddArticleDeps) {
  const { title, quote, url, categoryName, userId } = parseAddArticleFormData(
    formData,
    await getSelfId(),
  );

  // バリデーション済みValue Objectとして使用
  await articlesDomainService.ensureNoDuplicate(url, userId);
  // ...
}
```

### 注意事項

- パーサーはZodバリデーションを実行し、失敗時は`ZodError`をスロー
- `wrapServerSideErrorForClient`で`InvalidFormatError`に変換される
- `userId`は認証層から取得し、パーサーに渡す

## Cache Invalidation Pattern

タグベースのキャッシュ無効化パターン。

### 実装例

```typescript
// app/src/common/utils/cache-tag-builder.ts
import type { Status } from "@s-hirano-ist/s-core/common/entities/common-entity";

type Domain = "books" | "articles" | "notes" | "images";

export function buildContentCacheTag(
  domain: Domain,
  status: Status,
  userId: string,
): string {
  return `${domain}_${status}_${userId}`;
}

export function buildCountCacheTag(
  domain: Domain,
  status: Status,
  userId: string,
): string {
  return `${domain}_count_${status}_${userId}`;
}
```

### タグ命名規則

| 関数 | タグ形式 | 例 |
|------|---------|-----|
| `buildContentCacheTag` | `{domain}_{status}_{userId}` | `articles_UNEXPORTED_user-123` |
| `buildCountCacheTag` | `{domain}_count_{status}_{userId}` | `articles_count_EXPORTED_user-123` |

### 使用例

```typescript
// add-article.core.ts
import { revalidateTag } from "next/cache";
import { buildContentCacheTag, buildCountCacheTag } from "@/common/utils/cache-tag-builder";

// 永続化後にキャッシュを無効化
await commandRepository.create(article);

revalidateTag(buildContentCacheTag("articles", article.status, userId));
revalidateTag(buildCountCacheTag("articles", article.status, userId));
revalidateTag("categories"); // カテゴリ一覧も無効化
```

### 注意事項

- タグはユーザーIDを含めてマルチテナント分離を維持
- ステータス変更時は両方のステータスのキャッシュを無効化
- カテゴリ等の関連データも忘れずに無効化

## Data Fetching Pattern

`"use cache"`ディレクティブとReact `cache()`を使用したデータフェッチパターン。

### 実装例

```typescript
// app/src/application-services/articles/get-articles.ts
import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";

// 内部実装: "use cache"でキャッシュ
export const _getArticles = async (
  currentCount: number,
  userId: UserId,
  status: Status,
  cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
  "use cache";
  cacheTag(
    `articles_${status}_${userId}`,
    `articles_${status}_${userId}_${currentCount}`,
  );

  const articles = await articlesQueryRepository.findMany(userId, status, {
    skip: currentCount,
    take: PAGE_SIZE,
    orderBy: { createdAt: "desc" },
    cacheStrategy,
  });

  const totalCount = await _getArticlesCount(userId, status);

  return { data: articles.map(transformToDTO), totalCount };
};

// 公開関数: cache()でリクエストレベル重複排除
export const getExportedArticles: GetPaginatedData<LinkCardStackInitialData> =
  cache(async (currentCount: number) => {
    const userId = await getSelfId();
    return _getArticles(currentCount, userId, makeExportedStatus().status, {
      ttl: 400,
      swr: 40,
      tags: [`${sanitizeCacheTag(userId)}_articles_${currentCount}`],
    });
  });
```

### キャッシュ層の役割

| 層 | 技術 | 役割 |
|---|------|------|
| Next.js | `"use cache"` + `cacheTag()` | ビルド/リクエスト間キャッシュ |
| React | `cache()` | リクエスト内重複排除（同一リクエストで複数回呼ばれても1回のみ実行） |
| Prisma Accelerate | `cacheStrategy` | データベースレベルキャッシュ（TTL/SWR） |

### 命名規則

| パターン | 例 |
|---------|-----|
| 内部関数 | `_getArticles`（アンダースコアプレフィックス） |
| 公開関数 | `getExportedArticles`, `getUnexportedArticles` |

### 注意事項

- 内部関数は`"use cache"`でキャッシュ、公開関数は`cache()`でラップ
- `cacheTag()`で複数タグを設定し、柔軟な無効化を可能に
- Prisma Accelerateはデプロイ環境でのみ有効

## Event-Driven Architecture Pattern

ドメインイベントとPub-Subディスパッチャーによるイベント駆動アーキテクチャ。

### ディレクトリ構成

```
packages/core/
├── common/
│   └── events/
│       ├── base-domain-event.ts       # 基底クラス
│       ├── domain-event.interface.ts  # インターフェース
│       ├── system-error-event.ts      # システムイベント
│       └── system-warning-event.ts
└── [domain]/
    └── events/
        ├── article-created-event.ts   # ドメインイベント
        └── article-deleted-event.ts

app/src/infrastructures/events/
├── event-dispatcher.ts                # ディスパッチャー実装
└── event-setup.ts                     # ハンドラー登録
```

### 実装例

```typescript
// packages/core/common/events/base-domain-event.ts
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventType: string;
  public readonly payload: Record<string, unknown>;
  public readonly metadata: {
    timestamp: Date;
    caller: string;
    userId: string;
  };

  constructor(
    eventType: string,
    payload: Record<string, unknown>,
    metadata: { caller: string; userId: string },
  ) {
    this.eventType = eventType;
    this.payload = payload;
    this.metadata = { ...metadata, timestamp: new Date() };
  }
}
```

```typescript
// packages/core/articles/events/article-created-event.ts
import { BaseDomainEvent } from "../../common/events/base-domain-event.js";

export class ArticleCreatedEvent extends BaseDomainEvent {
  constructor(data: {
    title: string;
    url: string;
    quote: string;
    categoryName: string;
    userId: string;
    caller: string;
  }) {
    super(
      "article.created",
      { title: data.title, url: data.url, quote: data.quote, categoryName: data.categoryName },
      { caller: data.caller, userId: data.userId },
    );
  }
}
```

```typescript
// app/src/infrastructures/events/event-dispatcher.ts
class EventDispatcher {
  private handlers: Map<string, DomainEventHandler[]> = new Map();

  register(eventType: string, handler: DomainEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)?.push(handler);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventType);
    if (eventHandlers) {
      await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
    }
  }
}

export const eventDispatcher = new EventDispatcher();
```

### イベントタイプ命名規則

| パターン | 例 |
|---------|-----|
| ドメインイベント | `{domain}.{action}` (`article.created`, `article.deleted`) |
| システムイベント | `system.error`, `system.warning` |

### 使用例

```typescript
// エンティティ作成時にイベント生成
const [article, event] = articleEntity.create({ ... });

// 永続化後にディスパッチ
await commandRepository.create(article);
await eventDispatcher.dispatch(event);
```

## Repository CQRS Pattern

Command/Query責務分離のリポジトリパターン。

### ディレクトリ構成

```
packages/core/[domain]/repositories/
├── {domain}-command-repository.interface.ts   # Commandインターフェース
└── {domain}-query-repository.interface.ts     # Queryインターフェース

app/src/infrastructures/[domain]/repositories/
├── {domain}-command-repository.ts             # Command実装
└── {domain}-query-repository.ts               # Query実装
```

### 命名規則

| パターン | 例 |
|---------|-----|
| Command インターフェース | `IArticlesCommandRepository` |
| Query インターフェース | `IArticlesQueryRepository` |
| Command 実装 | `articlesCommandRepository` |
| Query 実装 | `articlesQueryRepository` |

### 実装例（インターフェース）

```typescript
// packages/core/articles/repositories/articles-command-repository.interface.ts
export type IArticlesCommandRepository = {
  create(data: UnexportedArticle): Promise<void>;
  deleteById(id: Id, userId: UserId, status: Status): Promise<DeleteArticleResult>;
};
```

```typescript
// packages/core/articles/repositories/articles-query-repository.interface.ts
export type IArticlesQueryRepository = {
  findByUrl(url: Url, userId: UserId): Promise<UnexportedArticle | ExportedArticle | null>;
  findMany(userId: UserId, status: Status, params: ArticlesFindManyParams): Promise<ArticleListItemDTO[]>;
  count(userId: UserId, status: Status): Promise<number>;
  search(query: string, userId: UserId, limit?: number): Promise<ArticleListItemDTO[]>;
};
```

### 実装例（オブジェクトリテラル）

```typescript
// app/src/infrastructures/articles/repositories/articles-command-repository.ts
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles";
import prisma from "@/prisma";

async function create(data: UnexportedArticle): Promise<void> {
  await prisma.article.create({
    data: {
      id: data.id,
      title: data.title,
      url: data.url,
      // ...
    },
  });
}

async function deleteById(id: Id, userId: UserId, status: Status): Promise<DeleteArticleResult> {
  const data = await prisma.article.delete({
    where: { id, userId, status },
    select: { title: true },
  });
  return { title: data.title };
}

export const articlesCommandRepository: IArticlesCommandRepository = {
  create,
  deleteById,
};
```

### Command/Query分離の理由

| 種別 | 責務 | 最適化 |
|------|------|--------|
| Command | 書き込み操作（create, update, delete） | トランザクション整合性 |
| Query | 読み取り操作（find, count, search） | キャッシュ、パフォーマンス |

### 注意事項

- インターフェースはドメイン層（packages/core）に配置
- 実装はインフラ層（app/src/infrastructures）に配置
- オブジェクトリテラルパターンでシンプルに実装

## Dependency Injection Factory Pattern

テスタビリティのためのファクトリベースDI。

### 実装例

```typescript
// app/src/infrastructures/factories/domain-service-factory.ts
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import type { IArticlesQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
import { articlesQueryRepository } from "@/infrastructures/articles/repositories/articles-query-repository";

export type DomainServiceFactoryConfig = {
  articlesQueryRepository?: IArticlesQueryRepository;
  booksQueryRepository?: IBooksQueryRepository;
  // ...
};

const defaultConfig: Required<DomainServiceFactoryConfig> = {
  articlesQueryRepository,
  booksQueryRepository,
  // ...
};

export function createDomainServiceFactory(
  config: DomainServiceFactoryConfig = {},
) {
  const mergedConfig = { ...defaultConfig, ...config };

  return {
    createArticlesDomainService: (): ArticlesDomainService => {
      return new ArticlesDomainService(mergedConfig.articlesQueryRepository);
    },
    createBooksDomainService: (): BooksDomainService => {
      return new BooksDomainService(mergedConfig.booksQueryRepository);
    },
    // ...
  };
}

// デフォルトシングルトンインスタンス
export const domainServiceFactory = createDomainServiceFactory();
```

### 使用例（本番）

```typescript
// add-article.deps.ts
import { domainServiceFactory } from "@/infrastructures/factories/domain-service-factory";

export const defaultAddArticleDeps: AddArticleDeps = {
  commandRepository: articlesCommandRepository,
  domainServiceFactory: domainServiceFactory,
  eventDispatcher: eventDispatcher,
};
```

### 使用例（テスト）

```typescript
// add-article.test.ts
const mockQueryRepo: IArticlesQueryRepository = {
  findByUrl: vi.fn().mockResolvedValue(null),
  // ...
};

const testFactory = createDomainServiceFactory({
  articlesQueryRepository: mockQueryRepo,
});

const testDeps: AddArticleDeps = {
  commandRepository: mockCommandRepo,
  domainServiceFactory: testFactory,
  eventDispatcher: mockDispatcher,
};

// テスト実行
const result = await addArticleCore(formData, testDeps);
```

### 注意事項

- ファクトリ関数でデフォルト依存をマージし、テスト時のモック注入を容易に
- デフォルトシングルトン（`domainServiceFactory`）は本番で使用
- `createDomainServiceFactory`はテストでカスタム依存を注入する際に使用