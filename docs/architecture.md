# アーキテクチャ

## バージョン要件

本ドキュメントは **Next.js 16+** を前提としています（プロジェクト使用バージョン: 16.2.6）。

| API | 導入バージョン | 備考 |
|-----|--------------|------|
| `unauthorized()` | Next.js 15.1 | 未認証エラー用（401） |
| `cacheTag()` | Next.js 15.1 | キャッシュタグによる無効化制御 |
| `cacheLife()` | Next.js 15.1 | 15.0では`unstable_cacheLife`として提供 |
| `"use cache"` | Next.js 15.0 | v16では`cacheComponents: true`で有効化 |
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
ドメイン（`articles` / `books` / `images` / `notes`）ごとにサブパッケージを持ち、各ドメインは以下の構成を取る。横断的な要素は `shared-kernel/` に集約:
- `entities/` - コアビジネスロジックとドメインエンティティ
- `events/` - ドメインイベント（作成・削除等）
- `repositories/` - リポジトリインターフェース（依存性の逆転）
- `services/` - 複雑なビジネスロジックのためのドメインサービス
- `types/` - ドメイン固有の型と定数
- `shared-kernel/` - 全ドメイン共通の entities / errors / events / repositories / services / types

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
- **フォーマッター**: oxfmt（Prettier互換）- `pnpm format` / `pnpm format:check`を使用
  - インポート整理（sortImports）、Tailwindクラス並べ替え（sortTailwindcss）を含む
  - Biomeから移行済み（タブ・行幅80を踏襲）。設定は`.oxfmtrc.json`
  - **コンポーネントa11yテスト**: Storybookの全ストーリーに対して`@storybook/addon-a11y`（axe-core）で自動チェック（詳細は[testing.md](testing.md)を参照）
- **リンター**: oxlint（type-aware、Rust製）- `pnpm lint`を使用
  - ESLintから全面移行済み。旧Biomeのbase lint（correctness）も吸収
  - Reactフック強制を含むTypeScript厳格設定、Next.js/jsx-a11yプラグイン統合

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
- `.oxfmtrc.json` - フォーマッター設定（oxfmt: format + import/Tailwind並べ替え）
- `.oxlintrc.json` - リンター設定（oxlint, type-aware）
- `.dependency-cruiser.cjs` - アーキテクチャ境界の強制（詳細は[code-analysis.md](code-analysis.md)を参照）

## セキュリティ

### 自動依存関係管理（Renovate + Dependabot）
- **役割分担**:
  - **Renovate**: npm（pnpm）/ mise / nvm / 四半期の lockFileMaintenance。npm を Renovate が担当するのは、Dependabot のサポート上限が pnpm v10 で、本リポジトリの `packageManager`（pnpm@11）では npm ジョブが `does not support your pnpm version` で失敗するため（pnpm v11 サポートは未対応: dependabot/dependabot-core#14794）。
  - **Dependabot**: pnpm 非依存の github-actions / docker-compose。低リスク更新は `dependabot-auto-merge.yaml` で auto-merge。
- **スケジュール**: Renovate は週次（月曜日11時（JST）前）、Dependabot は日次（09:00 JST）。
- **脆弱性アラート**: セキュリティ問題の自動PR（`security`ラベル付き、Renovate）
- **サプライチェーン保護**: パッチ/マイナーの最小リリース経過時間（cooldown）2日、グローバル最小24時間
- **設定**: [.github/renovate.json5](../.github/renovate.json5) / [.github/dependabot.yml](../.github/dependabot.yml) を参照

### npm/pnpmセキュリティ設定
- **バージョン固定**: pnpm-workspace.yamlの`savePrefix: ''`
- **ライフサイクルスクリプト保護**: `allowBuilds`（明示許可制）+ `strictDepBuilds: true`で未登録パッケージのスクリプト実行をハードエラー化
- **推移的依存の制限**: `blockExoticSubdeps: true`でnpmレジストリ以外（Git/tarball URL）由来の間接依存をブロック
- **CI/CD**: 全CIワークフローで`--frozen-lockfile`を強制
- **最小リリース経過時間**: 新規公開された悪意のあるパッケージを避けるための24時間グローバル設定

完全なセキュリティベストプラクティスについては[SECURITY.md](../SECURITY.md)を参照してください。

## Authorization Pattern

認可はシンプルに「認証済みかどうか」だけで判定します。ログインしているユーザーはオーナー本人であり、すべての操作が可能です。ロール（viewer/dumper）や権限による区別は廃止されています。

### 認証関数

| 関数 | 説明 |
|------|------|
| `requireAuth(): Promise<void>` | 認証チェック。未認証なら `unauthorized()` にリダイレクト |
| `getSelfId(): Promise<UserId>` | 認証済みユーザーIDの取得（未認証なら `unauthorized()`） |
| `withSelfTenant(fn): Promise<T>` | `getSelfId()` で認証し、テナントスコープ（`tenantContext`）を確立して `fn` を実行 |

### Server Actionでの認可

mutation系Server Action（`add-*.ts` / `delete-*.ts`）は `withSelfTenant()` でラップします。`withSelfTenant` は内部で `getSelfId()` を呼んで認証し（未認証なら `unauthorized()` にリダイレクト）、`AsyncLocalStorage` のテナントスコープを確立した上で Core 処理を実行します。ログイン済みのオーナーは全操作が可能で、ロールによる区別はありません。

```typescript
// app/src/application-services/articles/add-article.ts
"use server";
import "server-only";
import { withSelfTenant } from "@/common/tenant/with-tenant";
import type { ServerAction } from "@/common/types";
import { addArticleCore } from "./add-article.core";
import { defaultAddArticleDeps } from "./add-article.deps";

export async function addArticle(formData: FormData): Promise<ServerAction> {
  return withSelfTenant(() => addArticleCore(formData, defaultAddArticleDeps));
}
```

**ポイント:**
- `withSelfTenant()`は未認証時に`unauthorized()`（401）にリダイレクトする（`getSelfId()`経由）
- 認証＋テナントスコープ確立はServer Action層（`add-*.ts` / `delete-*.ts`）で実行し、Core層には認証を渡さない
- 読み取り系（`get-*.ts`）は既に `getSelfId()` で取得した `userId` を使って `tenantContext.run({ userId }, ...)` でスコープを張る
- ページ境界や読み取り委譲Server Action（`load-more-*.ts`）は従来どおり `requireAuth()` を使う
- `requireAuth` / `getSelfId` は`@/common/auth/session.ts`、`withSelfTenant` は`@/common/tenant/with-tenant.ts`に配置

### テナント隔離（DB層の多重防御）

リポジトリは全クエリで `where: { userId }` を明示指定していますが、これは**コードレビュー依存**でフェイルセーフがありません。これを補強するため、Prisma Client Extensions と `AsyncLocalStorage` で対象モデル（Article / Note / Image / Book / Category）の操作に `userId` をDB層で強制します（[app/src/prisma.ts](../app/src/prisma.ts) の `tenantExtension`、注入ロジックは [app/src/common/tenant/tenant-filter.ts](../app/src/common/tenant/tenant-filter.ts)）。

| 操作 | 挙動（`tenantContext` が無い場合） |
|------|------------------------------------|
| `findMany` / `findFirst` / `count` / `aggregate` / `groupBy` | **fail-open**: 無変換でパススルー（既存の `where: { userId }` が防御）。スコープがあれば `where` に `AND { userId }` を注入 |
| `create` / `update` / `delete` / `*Many` / `upsert` | **fail-closed**: スコープが無ければ例外。`create` は `data.userId` を上書き、`update`/`delete` は `where` に `userId` をマージ |
| `findUnique` / `findUniqueOrThrow` | 常に無変換。Prisma が unique セレクタしか許さないため、複合ユニークキー規約（`url_userId` 等）で `userId` を担保する |

**規約:**
- 対象モデルを `findUnique` する場合は必ず複合ユニークキー（`x_userId`）を使い、素の `id` だけで引かない
- 読み取りは `"use cache"` 境界を跨ぐと `AsyncLocalStorage` が伝播しない可能性があるため fail-open。書き込みは use cache を跨がず確実にスコープが立つため fail-closed
- cron / migration 等のシステム操作が将来必要になれば `tenantContext.run({ userId, system: true }, ...)` で明示バイパスする
- 既存リポジトリの `userId` 明示渡しは**残す**（冗長だが二重防御）

### ページ・コンポーネントでの認証

ページ配下の認証は `(authenticated)/layout.tsx` の `await requireAuth();` と、各データloaderの `getSelfId()` で担保します。コンポーネント境界には権限チェックを持たない純粋なエラー境界 `ErrorBoundary` を用います。

```typescript
// ページでの使用例（純粋なエラー境界）
<ErrorBoundary
  errorCaller="ArticlesStack"
  render={() => <ArticlesStackLoader variant="exported" />}
/>
```

**`ErrorBoundary`の責務:**
- 配下で発生したエラーを捕捉してフォールバックUIを表示
- 認可チェックは行わない（認証は`(authenticated)/layout.tsx`の`requireAuth()`が担保）
- エラー発生時は`errorCaller`を含めてエラーを伝播

### 実装箇所

| ファイル | 内容 |
|---------|------|
| `/app/src/common/auth/session.ts` | 認証関数（`requireAuth` / `getSelfId`）の定義 |
| `/app/src/common/tenant/tenant-context.ts` | `AsyncLocalStorage` テナントスコープの定義 |
| `/app/src/common/tenant/tenant-filter.ts` | テナント注入の純粋ロジック（`applyTenantFilter`） |
| `/app/src/common/tenant/with-tenant.ts` | 認証＋スコープ確立ヘルパ（`withSelfTenant`） |
| `/app/src/prisma.ts` | Prisma Client Extension（`tenantExtension`）でDB層に強制 |
| `/app/src/components/common/layouts/error-boundary.tsx` | エラー境界コンポーネント |
| `/app/src/app/[locale]/(authenticated)/layout.tsx` | 認証ゲート（`requireAuth()`） |

## i18n Pattern

next-intlを使用した国際化パターン。

### ディレクトリ構成

```
app/src/infrastructures/i18n/
├── routing.ts          # ルーティング設定（Link, redirect, useRouter等）
└── request.ts          # リクエストスコープ設定

app/messages/
├── ja.json             # 日本語翻訳
└── en.json             # 英語翻訳
```

### 翻訳ファイル構造

```json
// app/messages/ja.json
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
  <ErrorBoundary
    errorCaller="ArticlesStack"
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

エラーハンドリングを担うコンポーネント境界パターン。認証はページ側（`(authenticated)/layout.tsx` の `requireAuth()`）と各loaderの `getSelfId()` で担保するため、`ErrorBoundary` は権限チェックを持たない純粋なエラー境界です。

### ErrorBoundary Props

| Props | 型 | 説明 |
|-------|---|------|
| `render` | `() => ReactNode` | 描画するコンポーネント |
| `errorCaller` | `string` | エラー追跡用の識別子 |
| `fallback` | `ReactNode` (optional) | エラー時のフォールバックUI |

### 基本的な使用パターン

```typescript
// Suspense + ErrorBoundary + Loader の組み合わせ
<Suspense fallback={<Loading />}>
  <ErrorBoundary
    errorCaller="ArticlesStack"
    render={() => <ArticlesStackLoader variant="exported" />}
  />
</Suspense>
```

### コンポーネント階層

```
Suspense (Loading状態を処理)
└── ErrorBoundary (エラーを処理)
    └── Loader (データフェッチ)
        └── Server Component (表示)
```

### エラー伝播の仕組み

1. **Loader層**: エラーをcatchせずに上位に伝播
2. **ErrorBoundary層**: エラーを捕捉してフォールバックを表示、想定外のものは再throw
3. **`/app/src/app/error.tsx`**: 未処理エラーをキャッチしSentryに報告

```typescript
// app/src/app/error.tsx の役割
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
| `/app/src/components/common/layouts/error-boundary.tsx` | ErrorBoundaryコンポーネント |
| `/app/src/app/error.tsx` | ルートレベルのエラーハンドラー |

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
// app/next.config.mjs
const nextConfig = {
  cacheComponents: true, // v16: 静的シェル + 動的ストリーミング
  reactCompiler: true,
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

### `cacheComponents` フラグ

Next.js 16では`cacheComponents`フラグにより、IO操作の動的/静的な振る舞いを制御:

```typescript
// app/next.config.mjs
const nextConfig = {
  cacheComponents: true,
};
```

`cacheComponents`有効時:
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
    ├── add-{domain}.ts         # Server Action（認証）
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
import { requireAuth } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { addArticleCore } from "./add-article.core";
import { defaultAddArticleDeps } from "./add-article.deps";

export async function addArticle(formData: FormData): Promise<ServerAction> {
  await requireAuth();

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
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
import { articlesCommandRepository } from "@/infrastructures/articles/repositories/articles-command-repository";
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
| Action | `add-*.ts` | 認証（`requireAuth()`）、`"use server"`ディレクティブ |
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
// packages/core/shared-kernel/errors/error-classes.ts
// エラークラスはドメイン層に配置され、app層からは以下のようにインポート:
// import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";

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
import { GenericFormWrapper } from "@s-hirano-ist/s-ui/forms/generic-form-wrapper";
import { FormInput } from "@s-hirano-ist/s-ui/forms/fields/form-input";
import { FormTextarea } from "@s-hirano-ist/s-ui/forms/fields/form-textarea";

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

`GenericFormWrapper`はServer Action統合・ローディング状態・エラー時のフォーム値保存をまとめて提供する:

```typescript
// packages/ui/forms/generic-form-wrapper.tsx
"use client";
import { createContext, use, useActionState, useMemo, useState } from "react";

// 子フィールドへフォーム値を共有するContext
const FormValuesContext = createContext<Record<string, string>>({});

export function GenericFormWrapper<
  T extends { message: string; success: boolean },
>({
  action,
  children,
  saveLabel,
  submitLabel,
  loadingLabel,
  onSubmit,
  preservedValues,
  afterSubmit,
}: GenericFormWrapperProps<T>) {
  // エラー時のみセットされ、成功時にクリアされるサーバー応答のフォームデータ
  const [serverFormData, setServerFormData] =
    useState<Record<string, string> | null>(null);

  // 値の優先順位: サーバー応答 → preservedValues → 空
  const formValues = useMemo(
    () => serverFormData ?? preservedValues ?? {},
    [serverFormData, preservedValues],
  );

  const submitForm = async (_prev: T | null, formData: FormData) => {
    if (onSubmit) {
      await onSubmit(formData);
      return null;
    }
    const response = await action(formData);
    afterSubmit(response.message);
    if (response.success) {
      setServerFormData(null); // 成功時はクリア
      return response;
    }
    // エラー時はformDataを保存して入力を復元できるようにする
    if ("formData" in response && response.formData) {
      setServerFormData(response.formData as Record<string, string>);
    }
    return response;
  };

  const [_, submitAction, isPending] = useActionState(submitForm, null);

  return (
    <FormValuesContext.Provider value={formValues}>
      <form action={submitAction} className="space-y-4 px-2 py-4">
        {isPending ? <Loading /> : children}
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending && loadingLabel ? loadingLabel : (submitLabel ?? saveLabel)}
        </Button>
      </form>
    </FormValuesContext.Provider>
  );
}
```

### useFormValues Hook

エラー時に保存されたフォーム値へ子フィールドからアクセスするためのContext consumer。引数は取らず、保存済みの値（`Record<string, string>`）を返す。`GenericFormWrapper`と同一ファイルで定義・exportされる:

```typescript
// packages/ui/forms/generic-form-wrapper.tsx
export const useFormValues = () => use(FormValuesContext);

// 利用例（フィールドコンポーネント側）
function MyFormField({ name }: { name: string }) {
  const formValues = useFormValues();
  return <input name={name} defaultValue={formValues[name]} />;
}
```

`GenericFormWrapper`がエラー応答の`formData`を`FormValuesContext`へ流し込み、各フィールドは`defaultValue`として値を復元する。`formRef`やフォームの明示的なresetは使わず、ローディング中は`children`の代わりに`<Loading />`を表示する。

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
| `/packages/ui/forms/generic-form-wrapper.tsx` | `GenericFormWrapper`コンポーネント + `useFormValues`フック（同一ファイルで定義・export） |
| `/packages/ui/forms/fields/` | `useFormValues`で復元値を読む各フィールド（form-input / form-textarea 等） |

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
import type { LinkCardData } from "@/components/common/layouts/cards/types";

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
| `/app/src/components/common/layouts/cards/types.ts` | UI型定義（`LinkCardData`等） |

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
import type { IArticlesCommandRepository } from "@s-hirano-ist/s-core/articles/repositories/articles-command-repository.interface";
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