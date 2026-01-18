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
