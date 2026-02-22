# アーキテクチャ

## バージョン要件

本ドキュメントは **Next.js 15.1+** を前提としています。

| API | 最小バージョン | 備考 |
|-----|--------------|------|
| `forbidden()` | Next.js 15.0 | 認可エラー用（403） |
| `cacheTag()` | Next.js 15.1 | キャッシュタグによる無効化制御 |
| `cacheLife()` | Next.js 15.1 | 15.0では`unstable_cacheLife`として提供 |
| `"use cache"` | Next.js 15.0 | `dynamicIO`フラグ有効時のみ |
| `connection()` | Next.js 15.0 | 動的レンダリングのオプトイン |

## 目次
- [クリーンアーキテクチャの構成](#クリーンアーキテクチャの構成)
- [ドメインモデル](#ドメインモデル)
- [コードスタイルとアーキテクチャルール](#コードスタイルとアーキテクチャルール)
- [セキュリティ](#セキュリティ)
- [Authorization Pattern](#authorization-pattern)
- [i18n Pattern](#i18n-pattern)
- [Loader Pattern](#loader-pattern)
- [Error Boundary Pattern](#error-boundary-pattern)
- [Partial Prerendering (PPR)](#partial-prerendering-ppr)
- [Dynamic Rendering](#dynamic-rendering)
- [Server Actions Architecture Pattern](#server-actions-architecture-pattern)
- [Value Object Pattern with Zod Branding](#value-object-pattern-with-zod-branding)
- [Domain Entity Creation Pattern](#domain-entity-creation-pattern)
- [Server-Side Error Handling Pattern](#server-side-error-handling-pattern)
- [Form Data Parsing Pattern](#form-data-parsing-pattern)
- [Client Form Pattern](#client-form-pattern)
- [Cache Invalidation Pattern](#cache-invalidation-pattern)
- [Data Fetching Pattern](#data-fetching-pattern)
- [DTO Transform Pattern](#dto-transform-pattern)
- [Event-Driven Architecture Pattern](#event-driven-architecture-pattern)
- [Repository CQRS Pattern](#repository-cqrs-pattern)
- [Dependency Injection Factory Pattern](#dependency-injection-factory-pattern)

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
| `shared-kernel/services/` | `minioStorageService` | `IStorageService` | MinIOクライアント |
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
- **依存関係管理**: 循環依存検出用にdependency cruiserを設定（詳細は[code-analysis.md](code-analysis.md)を参照）

### インポートルール

**バレルインポート禁止**

バレルインポート（`index.ts`経由でのre-export）は以下の理由から禁止です：
- バンドルサイズの増大（Tree-shakingの効果低下）
- 循環依存の発生リスク
- ビルド時間の増加
- 依存関係の不明確化

**ディープパスインポートを使用**
```typescript
// ✅ Good: 直接ファイルからインポート
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles/services/articles-domain-service";
import type { IArticlesQueryRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-query-repository.interface";
import { ArticlesStackLoader } from "@/loaders/articles/articles-stack-loader";

// ❌ Bad: バレルインポート
import { ArticlesDomainService } from "@s-hirano-ist/s-core/articles";
import { ArticlesStackLoader } from "@/loaders/articles";
```

### 設定ファイル
- `biome.json` - 主要フォーマッター/リンター設定
- `eslint.config.ts` - React/Next.js用補助ESLint設定
- `.dependency-cruiser.cjs` - アーキテクチャ境界の強制（詳細は[code-analysis.md](code-analysis.md)を参照）

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

## Authorization Pattern

Server Actionsとコンポーネントでの認可チェックパターン。

### 権限チェック関数の命名規則

| パターン | 例 |
|---------|-----|
| 権限チェック関数 | `has*Permission` |
| 例 | `hasDumperPostPermission`, `hasViewerAdminPermission` |

### Server Actionでの認可

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

**ポイント:**
- `forbidden()`はNext.js 15.0+で導入された403エラー用API
- 認可チェックはServer Action層（`add-*.ts`）で実行し、Core層には渡さない
- `hasDumperPostPermission`等の権限チェック関数は`@/common/auth/session.ts`に配置

### コンポーネントでの認可

```typescript
// ページでの使用例
<ErrorPermissionBoundary
  errorCaller="ArticlesStack"
  permissionCheck={hasViewerAdminPermission}
  render={() => <ArticlesStackLoader variant="exported" />}
/>
```

**`ErrorPermissionBoundary`の責務:**
- `permissionCheck`で権限を確認
- 権限がない場合はフォールバックUIを表示
- エラー発生時は`errorCaller`を含めてエラーを伝播

### 実装箇所

| ファイル | 内容 |
|---------|------|
| `/app/src/common/auth/session.ts` | 権限チェック関数の定義 |
| `/app/src/components/common/layouts/error-permission-boundary.tsx` | 認可境界コンポーネント |

## i18n Pattern

next-intlを使用した国際化パターン。

### ディレクトリ構成

```
app/src/infrastructures/i18n/
├── routing.ts          # ルーティング設定（Link, redirect, useRouter等）
└── request.ts          # リクエストスコープ設定

messages/
├── ja.json             # 日本語翻訳
└── en.json             # 英語翻訳
```

### 翻訳ファイル構造

```json
// messages/ja.json
{
  "label": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除"
  },
  "message": {
    "inserted": "追加しました",
    "deleted": "削除しました"
  },
  "statusCode": {
    "403": "アクセス権限がありません",
    "404": "ページが見つかりません"
  }
}
```

### Server Componentでの使用

```typescript
import { getTranslations } from "next-intl/server";

export async function ServerComponent() {
  const t = await getTranslations("statusCode");

  return <h1>{t("403")}</h1>;
}
```

### Client Componentでの使用

```typescript
"use client";
import { useTranslations } from "next-intl";

export function ClientComponent() {
  const label = useTranslations("label");
  const message = useTranslations("message");

  return (
    <button onClick={() => toast(message("inserted"))}>
      {label("save")}
    </button>
  );
}
```

### Navigationコンポーネント

```typescript
// ❌ Bad: next/linkから直接インポート
import Link from "next/link";
import { redirect } from "next/navigation";

// ✅ Good: routing.tsからインポート（ロケール自動付与）
import { Link, redirect, useRouter } from "@/infrastructures/i18n/routing";
```

**ポイント:**
- `Link`, `redirect`, `useRouter`は`@/infrastructures/i18n/routing`からインポート
- これにより現在のロケールが自動的にURLに付与される
- `next/link`や`next/navigation`から直接インポートしない

### 使い分けまとめ

| コンテキスト | API |
|------------|-----|
| Server Component | `getTranslations()` |
| Client Component | `useTranslations()` |
| Navigation | `@/infrastructures/i18n/routing` |

## Loader Pattern

Suspense境界内でデータフェッチを実行し、取得データをプレゼンテーションコンポーネントに渡すパターン。

### ディレクトリ構成

```
app/src/loaders/
├── types.ts                # 共通型定義
└── [domain]/
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

## Error Boundary Pattern

認可チェックとエラーハンドリングを統合したコンポーネント境界パターン。

### ErrorPermissionBoundary Props

| Props | 型 | 説明 |
|-------|---|------|
| `render` | `() => ReactNode` | 権限がある場合に描画するコンポーネント |
| `permissionCheck` | `() => Promise<boolean>` | 非同期の権限チェック関数 |
| `errorCaller` | `string` | エラー追跡用の識別子 |
| `fallback` | `ReactNode` (optional) | 権限がない場合のフォールバックUI |

### 基本的な使用パターン

```typescript
// Suspense + ErrorPermissionBoundary + Loader の組み合わせ
<Suspense fallback={<Loading />}>
  <ErrorPermissionBoundary
    errorCaller="ArticlesStack"
    permissionCheck={hasViewerAdminPermission}
    render={() => <ArticlesStackLoader variant="exported" />}
  />
</Suspense>
```

### コンポーネント階層

```
Suspense (Loading状態を処理)
└── ErrorPermissionBoundary (認可とエラーを処理)
    └── Loader (データフェッチ)
        └── Server Component (表示)
```

### エラー伝播の仕組み

1. **Loader層**: エラーをcatchせずに上位に伝播
2. **ErrorPermissionBoundary層**: 権限エラーを処理、その他は再throw
3. **`/app/[locale]/error.tsx`**: 未処理エラーをキャッチしSentryに報告

```typescript
// app/[locale]/error.tsx の役割
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

### 実装箇所

| ファイル | 内容 |
|---------|------|
| `/app/src/components/common/layouts/error-permission-boundary.tsx` | ErrorPermissionBoundaryコンポーネント |
| `/app/[locale]/error.tsx` | ルートレベルのエラーハンドラー |

### 注意事項

- Loader内でエラーをtry-catchで握りつぶさない
- `errorCaller`は問題追跡に使用されるため、コンポーネントを特定できる名前を付ける
- Sentry連携によりプロダクションエラーを自動監視

## Partial Prerendering (PPR)

Next.js 15で導入されたPartial Prerenderingは、静的シェルと動的コンテンツを組み合わせるレンダリング戦略。

### 概要

PPRは以下の特性を持つ:
- **静的シェル**: ページの静的部分をビルド時にプリレンダリング
- **動的ホール**: Suspense境界内の動的コンテンツを遅延読み込み
- **ストリーミング**: 静的部分を即座に配信し、動的部分をストリーミング

### 有効化

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
};
```

### Loader Pattern との組み合わせ

本コードベースのLoader Patternは、PPRと自然に統合できる:

```typescript
// 静的シェル（即座に配信）
export default function ArticlesPage() {
  return (
    <div>
      <Header /> {/* 静的 */}
      <Sidebar /> {/* 静的 */}

      {/* 動的ホール（Suspense境界内でストリーミング） */}
      <Suspense fallback={<ArticlesSkeleton />}>
        <ArticlesStackLoader variant="exported" />
      </Suspense>
    </div>
  );
}
```

**ポイント:**
- 認証情報を必要としないUIコンポーネントは静的シェルとして即座に配信
- データフェッチを伴うLoaderはSuspense境界内に配置し、動的ホールとして扱う
- Skeleton/Loading UIを適切に設計し、ユーザー体験を最適化

### 注意事項

- PPRは現在experimental機能
- `cookies()`, `headers()`, `searchParams`を使用するコンポーネントは自動的に動的になる
- 静的/動的の境界を意識した設計が重要

## Dynamic Rendering

Next.js 15での動的レンダリングの制御方法。

### 動的レンダリングのトリガー

以下のAPIを使用すると、そのルート/コンポーネントは動的にレンダリングされる:

| API | 用途 |
|-----|------|
| `cookies()` | Cookie読み取り |
| `headers()` | リクエストヘッダー読み取り |
| `searchParams` | クエリパラメータ |
| `connection()` | 明示的な動的オプトイン |

### `dynamicIO` フラグ

Next.js 15.1+では`dynamicIO`フラグにより、IO操作の動的/静的な振る舞いを制御:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
};
```

`dynamicIO`有効時:
- `fetch`、データベースクエリ等のIO操作はデフォルトで動的
- `"use cache"`ディレクティブでキャッシュを明示的にオプトイン
- 動的IOを行わないルートは自動的に静的プリレンダリング

### `connection()` API

動的レンダリングを明示的にオプトインする:

```typescript
import { connection } from "next/server";

async function DynamicComponent() {
  await connection(); // このコンポーネントを動的にする

  const data = await fetchRealTimeData();
  return <div>{data}</div>;
}
```

**使用場面:**
- リアルタイムデータが必要な場合
- キャッシュを完全に回避したい場合
- リクエスト時の最新データが必須な場合

### 本コードベースでの方針

1. **デフォルト**: `"use cache"`でキャッシュし、`updateTag`で無効化（Server Action内）
2. **認証が必要なページ**: 認証チェックにより自動的に動的
3. **リアルタイム要件**: `connection()` APIで明示的にオプトイン

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
import {
  type createDomainServiceFactory,
  domainServiceFactory,
} from "@/infrastructures/factories/domain-service-factory";

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

### Progressive Enhancement

Server ActionsはProgressive Enhancementをサポートし、JavaScriptが無効な環境でも動作する。

**フォームでの使用:**

```typescript
// JavaScriptなしでも動作するフォーム
<form action={addArticle}>
  <input name="title" required />
  <input name="url" type="url" required />
  <button type="submit">追加</button>
</form>
```

**`useActionState`との組み合わせ:**

```typescript
"use client";
import { useActionState } from "react";
import { addArticle } from "@/application-services/articles/add-article";

function ArticleForm() {
  const [state, formAction, isPending] = useActionState(addArticle, null);

  return (
    <form action={formAction}>
      <input name="title" required disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "追加中..." : "追加"}
      </button>
      {state?.success === false && <p className="error">{state.message}</p>}
    </form>
  );
}
```

**Progressive Enhancement のポイント:**
- `action`属性を使用し、`onSubmit`ではなくネイティブフォーム送信を活用
- JavaScriptが有効な場合は`useActionState`で楽観的UI更新を提供
- JavaScriptが無効でもフォームは正常に送信され、ページがリロードされる
- `disabled={isPending}`で二重送信を防止

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
// packages/core/shared-kernel/entities/common-entity.ts
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
// Note: packages/core内部では相対インポートを使用
// パッケージ外からは @s-hirano-ist/s-core/common 等のバレルインポートを使用
import { createEntityWithErrorHandling } from "../../shared-kernel/services/entity-factory.js";
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
// packages/core/shared-kernel/services/entity-factory.ts
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

  if (error instanceof NotificationError) {
    await eventDispatcher.dispatch(new SystemWarningEvent({ ... }));
    return { success: false, message: "notificationFailed" };
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
// packages/core/errors/error-classes.ts
// エラークラスはドメイン層に配置され、app層からは以下のようにインポート:
// import { DuplicateError } from "@s-hirano-ist/s-core/errors/error-classes";

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

**エラークラスの分類基準:**

| エラークラス | 用途 | 発生箇所 |
|------------|------|---------|
| `UnexpectedError` | 予期せぬシステムエラー | catch-all |
| `InvalidFormatError` | Zodバリデーションエラー | エンティティファクトリ |
| `DuplicateError` | ビジネスルール違反（重複） | ドメインサービス |
| `FileNotAllowedError` | ファイル形式不正 | imagesドメイン |

### エラータイプ別処理

| エラータイプ | レスポンス message | イベント | ステータス |
|-------------|-------------------|---------|-----------|
| `DuplicateError` | `"duplicated"` | SystemWarningEvent | 400 |
| `InvalidFormatError` | `error.message` | SystemWarningEvent | 500 |
| `FileNotAllowedError` | `error.message` | SystemWarningEvent | 500 |
| `NotificationError` | `"notificationFailed"` | SystemWarningEvent | 500 |
| `AuthError` | `"signInUnknown"` | SystemWarningEvent | 401 |
| `PrismaClientKnownRequestError` | `"prismaUnexpected"` | SystemErrorEvent | 500 |
| `PrismaClientValidationError` | `"prismaUnexpected"` | SystemErrorEvent | 500 |
| `PrismaClientInitializationError` | `"prismaUnexpected"` | SystemErrorEvent | 500 |
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
import type { UserId } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
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

## Client Form Pattern

`GenericFormWrapper`を使用した再利用可能なフォームパターン。

### GenericFormWrapper Props

| Props | 型 | 説明 |
|-------|---|------|
| `action` | `(formData: FormData) => Promise<T>` | Server Action |
| `afterSubmit` | `(message: string) => void` | 送信後のコールバック（toast表示等） |
| `saveLabel` | `string` | 保存ボタンのラベル |
| `children` | `ReactNode` | フォームフィールド |

### 基本的な使用パターン

```typescript
"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { addArticle } from "@/application-services/articles/add-article";
import { GenericFormWrapper } from "@s-hirano-ist/ui/forms/generic-form-wrapper";
import { FormInput, FormTextarea } from "@s-hirano-ist/ui/forms";

export function ArticleForm() {
  const label = useTranslations("label");
  const message = useTranslations("message");

  return (
    <GenericFormWrapper<ServerAction>
      action={addArticle}
      afterSubmit={(msg) => toast(message(msg))}
      saveLabel={label("save")}
    >
      <FormInput name="title" label={label("title")} required />
      <FormInput name="url" label={label("url")} type="url" required />
      <FormTextarea name="quote" label={label("quote")} />
    </GenericFormWrapper>
  );
}
```

### 内部実装の仕組み

`GenericFormWrapper`は以下のReact Hooksを活用:

```typescript
// packages/ui/forms/generic-form-wrapper.tsx
"use client";
import { useActionState } from "react";
import { useFormValues } from "./hooks/use-form-values";

export function GenericFormWrapper<T extends ServerAction>({
  action,
  afterSubmit,
  saveLabel,
  children,
}: GenericFormWrapperProps<T>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const { formRef, savedValues } = useFormValues<T>(state);

  useEffect(() => {
    if (state?.success) {
      afterSubmit(state.message);
      formRef.current?.reset();
    }
  }, [state, afterSubmit]);

  return (
    <form ref={formRef} action={formAction}>
      {children}
      <Button type="submit" disabled={isPending}>
        {isPending ? <Spinner /> : saveLabel}
      </Button>
      {state?.success === false && (
        <ErrorMessage>{state.message}</ErrorMessage>
      )}
    </form>
  );
}
```

### useFormValues Hook

エラー時にフォーム値を保存し、ユーザー入力を失わないようにする:

```typescript
// packages/ui/forms/hooks/use-form-values.ts
export function useFormValues<T extends ServerAction>(state: T | null) {
  const formRef = useRef<HTMLFormElement>(null);
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // エラー時にformDataから値を復元
    if (state?.success === false && state.formData) {
      const restored = Object.fromEntries(state.formData.entries());
      setSavedValues(restored);
    }
  }, [state]);

  return { formRef, savedValues };
}
```

### Toast連携

```typescript
// afterSubmit コールバックでの toast 表示
afterSubmit={(msg) => toast(message(msg))}

// message(msg) は i18n キーを解決
// 例: msg = "inserted" → "追加しました"
```

### 実装箇所

| ファイル | 内容 |
|---------|------|
| `/packages/ui/forms/generic-form-wrapper.tsx` | GenericFormWrapperコンポーネント |
| `/packages/ui/forms/hooks/use-form-values.ts` | フォーム値保存Hook |

## Cache Invalidation Pattern

タグベースのキャッシュ無効化パターン。

### 実装例

```typescript
// app/src/infrastructures/shared/cache/cache-tag-builder.ts
import type { Status } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";

type Domain = "books" | "articles" | "notes" | "images";

export function buildContentCacheTag(
  domain: Domain,
  status: Status,
  userId: string,
): string {
  return `${domain}_${status}_${sanitizeCacheTag(userId)}`;
}

export function buildCountCacheTag(
  domain: Domain,
  status: Status,
  userId: string,
): string {
  return `${domain}_count_${status}_${sanitizeCacheTag(userId)}`;
}

export function buildPaginatedContentCacheTag(
  domain: Domain,
  status: Status,
  userId: string,
  currentCount: number,
): string {
  return `${domain}_${status}_${sanitizeCacheTag(userId)}_${currentCount}`;
}

export function buildCategoriesCacheTag(userId: string): string {
  return `categories_${sanitizeCacheTag(userId)}`;
}
```

### タグ命名規則

| 関数 | タグ形式 | 例 |
|------|---------|-----|
| `buildContentCacheTag` | `{domain}_{status}_{sanitizedUserId}` | `articles_UNEXPORTED_auth` |
| `buildCountCacheTag` | `{domain}_count_{status}_{sanitizedUserId}` | `articles_count_EXPORTED_auth` |
| `buildPaginatedContentCacheTag` | `{domain}_{status}_{sanitizedUserId}_{count}` | `articles_UNEXPORTED_auth_0` |
| `buildCategoriesCacheTag` | `categories_{sanitizedUserId}` | `categories_auth` |

### 使用例（updateTag - Server Action内）

```typescript
// add-article.core.ts
import { updateTag } from "next/cache";
import {
  buildContentCacheTag,
  buildCountCacheTag,
  buildCategoriesCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";

// 永続化後にキャッシュを無効化
await commandRepository.create(article);

updateTag(buildContentCacheTag("articles", article.status, userId));
updateTag(buildCountCacheTag("articles", article.status, userId));
updateTag("categories"); // グローバルカテゴリ一覧
updateTag(buildCategoriesCacheTag(userId)); // ユーザー固有カテゴリ一覧
```

### 使用例（cacheTag）

```typescript
// get-articles.ts
import { cacheTag } from "next/cache";
import {
  buildContentCacheTag,
  buildCountCacheTag,
  buildPaginatedContentCacheTag,
  buildCategoriesCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";

// データフェッチ時にキャッシュタグを設定
export const _getArticles = async (currentCount: number, userId: UserId, status: Status) => {
  "use cache";
  cacheTag(
    buildContentCacheTag("articles", status, userId),
    buildPaginatedContentCacheTag("articles", status, userId, currentCount),
  );
  // ...
};

const _getCategories = async (userId: UserId) => {
  "use cache";
  cacheTag("categories", buildCategoriesCacheTag(userId));
  // ...
};
```

### 注意事項

- **必ずビルダー関数を使用**: `cacheTag()`と`updateTag()`で同じビルダー関数を使用し、タグの一貫性を保証
- タグはユーザーIDを含めてマルチテナント分離を維持
- ステータス変更時は両方のステータスのキャッシュを無効化
- カテゴリ等の関連データも忘れずに無効化

### キャッシュタグのサニタイズ

ユーザーIDをキャッシュタグに含める際は、`sanitizeCacheTag`でサニタイズする:

```typescript
// app/src/common/utils/cache-utils.ts
export function sanitizeCacheTag(userId: string): string {
  return userId.replaceAll(/[^a-zA-Z_]/g, "");
}
```

**目的:** キャッシュタグに使用できない文字（`|`等のAuth0ユーザーID内の特殊文字）を除去

**重要:** ビルダー関数は内部で`sanitizeCacheTag`を呼び出すため、呼び出し側で個別にサニタイズする必要はない

### `updateTag` vs `revalidateTag` vs `revalidatePath` の使い分け

| 観点 | `updateTag` | `revalidateTag` | `revalidatePath` |
|------|-------------|-----------------|------------------|
| **用途** | Server Action内のキャッシュ無効化 | Route Handler/webhook向け | パス単位の無効化 |
| **read-your-own-writes** | 保証あり | なし | なし |
| **無効化対象** | 特定タグを持つキャッシュ | 特定タグを持つキャッシュ | 特定パスに関連する全キャッシュ |
| **粒度** | 細かい（タグ単位） | 細かい（タグ単位） | 粗い（パス単位） |

**判断基準:**

```typescript
// ✅ updateTag: Server Action内での特定データの更新（推奨）
await commandRepository.create(article);
updateTag(`articles_UNEXPORTED_${userId}`);
updateTag(`articles_count_UNEXPORTED_${userId}`);

// ✅ revalidateTag: Route Handler/webhookでの無効化
revalidateTag("articles", { expire: 0 });

// ✅ revalidatePath: レイアウト全体の再検証が必要な場合
revalidatePath("/dashboard", "layout");
```

**本コードベースの方針:**
- **基本**: Server Action内では`updateTag`を使用し、read-your-own-writes保証を得る
- **`cacheTag`との対応**: データフェッチ時に設定したタグと同じタグで無効化
- **ブロードキャスト無効化**: 複数ユーザーに影響する変更は`revalidatePath`を検討

### キャッシュ無効化マトリクス

どの操作でどのタグを無効化すべきかを体系化したマトリクス。

#### 単一エンティティ操作

| 操作 | 無効化するタグ | 備考 |
|------|---------------|------|
| create | `{domain}_{status}`, `{domain}_count_{status}`, `categories` | 新規作成時。articlesドメインのみcategoriesも無効化 |
| update (ステータス変更なし) | `{domain}_{id}` | 内容のみ変更時 |
| update (ステータス変更あり) | `{domain}_{old_status}`, `{domain}_{new_status}`, `{domain}_count_{old_status}`, `{domain}_count_{new_status}` | 両ステータスのキャッシュを無効化 |
| delete | `{domain}_{status}`, `{domain}_count_{status}` | 削除時 |

#### バッチ操作

| 操作 | 無効化するタグ | ステータス遷移 | 備考 |
|------|---------------|---------------|------|
| batch reset | `{domain}_UNEXPORTED`, `{domain}_LAST_UPDATED`, `{domain}_EXPORTED`, `{domain}_count_UNEXPORTED`, `{domain}_count_LAST_UPDATED`, `{domain}_count_EXPORTED` | LAST_UPDATED→EXPORTED, UNEXPORTED→LAST_UPDATED | 全ステータスを無効化 |
| batch revert | `{domain}_UNEXPORTED`, `{domain}_LAST_UPDATED`, `{domain}_count_UNEXPORTED`, `{domain}_count_LAST_UPDATED` | LAST_UPDATED→UNEXPORTED | 関連ステータスを無効化 |

#### ステータス遷移図と無効化ルール

```
UNEXPORTED ──────────────→ LAST_UPDATED ──────────────→ EXPORTED
    ↑                           │
    └───────── (revert) ────────┘
```

| 遷移 | トリガー | 無効化するタグ |
|------|---------|---------------|
| UNEXPORTED → LAST_UPDATED | batch reset | `{domain}_UNEXPORTED`, `{domain}_LAST_UPDATED`, `{domain}_count_UNEXPORTED`, `{domain}_count_LAST_UPDATED` |
| LAST_UPDATED → EXPORTED | batch reset | `{domain}_LAST_UPDATED`, `{domain}_EXPORTED`, `{domain}_count_LAST_UPDATED`, `{domain}_count_EXPORTED` |
| LAST_UPDATED → UNEXPORTED | batch revert | `{domain}_UNEXPORTED`, `{domain}_LAST_UPDATED`, `{domain}_count_UNEXPORTED`, `{domain}_count_LAST_UPDATED` |

#### 実装例: ステータス変更時の無効化ヘルパー

```typescript
// app/src/infrastructures/shared/cache/cache-invalidation-helpers.ts
import { updateTag } from "next/cache";
import { buildContentCacheTag, buildCountCacheTag } from "./cache-tag-builder";

type Domain = "books" | "articles" | "notes" | "images";
type Status = "UNEXPORTED" | "LAST_UPDATED" | "EXPORTED";

/**
 * ステータス変更時のキャッシュ無効化
 */
export function invalidateOnStatusChange(
  domain: Domain,
  oldStatus: Status,
  newStatus: Status,
  userId: string,
): void {
  // 旧ステータスのキャッシュを無効化
  updateTag(buildContentCacheTag(domain, oldStatus, userId));
  updateTag(buildCountCacheTag(domain, oldStatus, userId));

  // 新ステータスのキャッシュを無効化
  updateTag(buildContentCacheTag(domain, newStatus, userId));
  updateTag(buildCountCacheTag(domain, newStatus, userId));
}

/**
 * バッチリセット時のキャッシュ無効化
 * UNEXPORTED → LAST_UPDATED, LAST_UPDATED → EXPORTED
 */
export function invalidateOnBatchReset(domain: Domain, userId: string): void {
  const statuses: Status[] = ["UNEXPORTED", "LAST_UPDATED", "EXPORTED"];

  for (const status of statuses) {
    updateTag(buildContentCacheTag(domain, status, userId));
    updateTag(buildCountCacheTag(domain, status, userId));
  }
}

/**
 * バッチリバート時のキャッシュ無効化
 * LAST_UPDATED → UNEXPORTED
 */
export function invalidateOnBatchRevert(domain: Domain, userId: string): void {
  const statuses: Status[] = ["UNEXPORTED", "LAST_UPDATED"];

  for (const status of statuses) {
    updateTag(buildContentCacheTag(domain, status, userId));
    updateTag(buildCountCacheTag(domain, status, userId));
  }
}
```

**使用例:**

```typescript
// batch-reset.core.ts
import { invalidateOnBatchReset } from "@/infrastructures/shared/cache/cache-invalidation-helpers";

export async function batchResetCore(deps: BatchResetDeps): Promise<ServerAction> {
  const userId = await getSelfId();

  await deps.commandRepository.batchReset(userId);

  // 全ステータスのキャッシュを無効化
  invalidateOnBatchReset("articles", userId);

  return { success: true, message: "reset" };
}
```

## Data Fetching Pattern

`"use cache"`ディレクティブとReact `cache()`を使用したデータフェッチパターン。

### 実装例

```typescript
// app/src/application-services/articles/get-articles.ts
import { cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import {
  buildContentCacheTag,
  buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";

// 内部実装: "use cache"でキャッシュ
export const _getArticles = async (
  currentCount: number,
  userId: UserId,
  status: Status,
): Promise<LinkCardStackInitialData> => {
  "use cache";
  cacheTag(
    buildContentCacheTag("articles", status, userId),
    buildPaginatedContentCacheTag("articles", status, userId, currentCount),
  );

  const articles = await articlesQueryRepository.findMany(userId, status, {
    skip: currentCount,
    take: PAGE_SIZE,
    orderBy: { createdAt: "desc" },
  });

  const totalCount = await _getArticlesCount(userId, status);

  return { data: articles.map(transformToDTO), totalCount };
};

// 公開関数: cache()でリクエストレベル重複排除
export const getExportedArticles: GetPaginatedData<LinkCardStackInitialData> =
  cache(async (currentCount: number) => {
    const userId = await getSelfId();
    return _getArticles(currentCount, userId, makeExportedStatus().status);
  });
```

### キャッシュ層の役割

| 層 | 技術 | 役割 |
|---|------|------|
| Next.js | `"use cache"` + `cacheTag()` | ビルド/リクエスト間キャッシュ |
| React | `cache()` | リクエスト内重複排除（同一リクエストで複数回呼ばれても1回のみ実行） |

### `cache()` と `"use cache"` の使い分け

| 観点 | `cache()` (React) | `"use cache"` (Next.js) |
|------|-------------------|-------------------------|
| **スコープ** | 単一リクエスト内 | リクエスト間（永続的） |
| **用途** | 同一レンダリングツリー内での重複排除 | ビルド時/ISR/動的キャッシュ |
| **無効化** | リクエスト終了で自動消滅 | `updateTag()` (Server Action) / `revalidateTag()` (Route Handler) |
| **認証データ** | 適切（リクエストスコープ） | 注意が必要（`cacheTag`でユーザー分離） |

**判断基準:**
1. **同一リクエスト内で複数回呼ばれる可能性がある** → `cache()` でラップ
2. **リクエスト間でキャッシュしたい** → `"use cache"` ディレクティブ
3. **両方の恩恵を受けたい** → 内部関数に `"use cache"`、公開関数を `cache()` でラップ（本コードベースの標準パターン）

```typescript
// 推奨パターン: 両方を組み合わせ + ビルダー関数使用
import { buildContentCacheTag } from "@/infrastructures/shared/cache/cache-tag-builder";

const _getData = async (userId: UserId, status: Status) => {
  "use cache";
  cacheTag(buildContentCacheTag("articles", status, userId));
  return await repository.findMany(userId, status);
};

export const getData = cache(async () => {
  const userId = await getSelfId();
  return _getData(userId, makeUnexportedStatus());
});
```

### 命名規則

| パターン | 例 |
|---------|-----|
| 内部関数 | `_getArticles`（アンダースコアプレフィックス） |
| 公開関数 | `getExportedArticles`, `getUnexportedArticles` |

### 注意事項

- 内部関数は`"use cache"`でキャッシュ、公開関数は`cache()`でラップ
- `cacheTag()`で複数タグを設定し、柔軟な無効化を可能に

## DTO Transform Pattern

Query RepositoryからUIまでのデータ形状変換パターン。

### 3層のデータ形状

| 層 | 形状 | 責務 |
|---|------|------|
| Domain | Entity（`UnexportedArticle`, `ExportedArticle`） | ビジネスルール、不変条件 |
| Query Repository | DTO（`ArticleListItemDTO`） | クエリ最適化、必要フィールドのみ |
| Application Service | UI型（`LinkCardData`） | 表示に最適化された形状 |

### Query RepositoryでのDTO定義

```typescript
// packages/core/articles/repositories/articles-query-repository.interface.ts
export type ArticleListItemDTO = {
  id: string;
  title: string;
  url: string;
  quote: string | null;
  categoryName: string;
  createdAt: Date;
};

export type IArticlesQueryRepository = {
  findMany(userId: UserId, status: Status, params: FindManyParams): Promise<ArticleListItemDTO[]>;
  // ...
};
```

### Application Serviceでの変換

```typescript
// app/src/application-services/articles/get-articles.ts
import type { LinkCardData } from "@s-hirano-ist/ui/cards/types";

function transformToLinkCard(dto: ArticleListItemDTO): LinkCardData {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.quote ?? "",
    primaryBadgeText: dto.categoryName,
    secondaryBadgeText: new URL(dto.url).hostname,
    href: dto.url,
  };
}

export const getExportedArticles = cache(async (currentCount: number) => {
  const userId = await getSelfId();
  const articles = await _getArticles(currentCount, userId, "EXPORTED");

  return {
    data: articles.map(transformToLinkCard),
    totalCount: await _getArticlesCount(userId, "EXPORTED"),
  };
});
```

### 変換ロジックの種類

| 変換 | 例 | 説明 |
|------|---|------|
| フラット化 | `category.name` → `categoryName` | ネストを解消 |
| 複合フィールド | `quote ?? ""` | null処理、デフォルト値 |
| URL処理 | `new URL(url).hostname` | ドメイン抽出 |
| フォーマット | `formatDate(createdAt)` | 日付整形 |
| 命名変換 | `url` → `href` | UIコンポーネントの期待する名前 |

### 変換の配置場所

```
Repository (DTO)
    ↓ そのまま返す
Application Service
    ↓ transformToXxx() で変換
UI Component (props)
```

**Application Serviceで変換する理由:**
- Repositoryはクエリ最適化に専念
- 変換ロジックをドメイン層から分離
- UIコンポーネントの要求に合わせやすい

### 実装例: 複数ドメインでの統一

```typescript
// 各ドメインで同じ UI 型に変換
// articles
const articleCard: LinkCardData = transformToLinkCard(articleDTO);

// books
const bookCard: LinkCardData = transformBookToLinkCard(bookDTO);

// notes
const noteCard: LinkCardData = transformNoteToLinkCard(noteDTO);

// 同じ LinkCardStack コンポーネントで表示可能
<LinkCardStack data={[...articleCards, ...bookCards, ...noteCards]} />
```

### 実装箇所

| ファイル | 内容 |
|---------|------|
| `/app/src/application-services/articles/get-articles.ts` | 記事のDTO→UI型変換 |
| `/app/src/application-services/books/get-books.ts` | 書籍のDTO→UI型変換 |
| `/packages/ui/cards/types.ts` | UI型定義（`LinkCardData`等） |

## Event-Driven Architecture Pattern

ドメインイベントとPub-Subディスパッチャーによるイベント駆動アーキテクチャ。

### ディレクトリ構成

```
packages/core/
├── shared-kernel/
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
// packages/core/shared-kernel/events/base-domain-event.ts
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
import { BaseDomainEvent } from "../../shared-kernel/events/base-domain-event.js";

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