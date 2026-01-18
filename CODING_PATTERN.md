# CODING_PATTERN.md - Loader Pattern

Next.js 15 App RouterにおけるLoader Patternのコーディング規約。

## 概要

データフェッチにおいてLoader Patternを採用する。Loader ComponentはSuspense境界内でサーバーサイドデータフェッチ（getXxx）を実行し、取得したデータをプレゼンテーションコンポーネントに渡す。

## ディレクトリ構成

```
app/src/
├── application-services/        # 変更なし - データ取得ロジック
│   └── [domain]/
│       ├── get-*.ts            # React.cache + "use cache"
│       └── get-*-from-client.ts
│
├── loaders/                     # Loaderコンポーネント
│   ├── types.ts                # 共通型定義
│   └── [domain]/
│       ├── index.ts            # 再エクスポート
│       ├── *-loader.tsx        # Loader実装
│       └── *.stories.tsx       # Storybook
│
├── components/                  # プレゼンテーション層
│   └── [domain]/
│       ├── server/             # Server Components（データを受け取る）
│       └── client/             # Client Components
```

## 命名規則

| パターン | 例 | 説明 |
|---------|-----|------|
| Loaderファイル | `{component}-loader.tsx` | `articles-stack-loader.tsx` |
| Loader関数 | `{Component}Loader` | `ArticlesStackLoader` |
| Loader Props | `{Component}LoaderProps` | `ArticlesStackLoaderProps` |

## 型定義

```typescript
// app/src/loaders/types.ts
import type { DeleteAction, LoadMoreAction, ServerAction } from "@/common/types";
import type {
  ImageCardStackInitialData,
  LinkCardStackInitialData,
} from "@/components/common/layouts/cards/types";

/**
 * 全Loaderの基底Props
 */
export type BaseLoaderProps = {
  errorCaller?: string;
};

/**
 * LinkCardStack用ページネーションLoader Props
 */
export type PaginatedLinkCardLoaderProps = BaseLoaderProps & {
  deleteAction?: DeleteAction;
  loadMoreAction: LoadMoreAction<LinkCardStackInitialData>;
};

/**
 * ImageCardStack用ページネーションLoader Props
 */
export type PaginatedImageCardLoaderProps = BaseLoaderProps & {
  deleteAction?: DeleteAction;
  loadMoreAction: LoadMoreAction<ImageCardStackInitialData>;
};

/**
 * フォーム用Loader Props
 */
export type FormLoaderProps<TFormData = FormData> = BaseLoaderProps & {
  submitAction: (formData: TFormData) => Promise<ServerAction>;
};

/**
 * カウンター用Loader Props
 */
export type CounterLoaderProps = BaseLoaderProps;
```

## Loaderコンポーネントの実装

### 基本パターン

```typescript
// app/src/loaders/articles/articles-stack-loader.tsx
import "server-only";

import {
  getExportedArticles,
  getUnexportedArticles,
} from "@/application-services/articles/get-articles";
import { ArticlesStack } from "@/components/articles/server/articles-stack";
import type { PaginatedLinkCardLoaderProps } from "@/loaders/types";

export type ArticlesStackLoaderProps = PaginatedLinkCardLoaderProps & {
  variant: "exported" | "unexported";
};

/**
 * ArticlesStackのLoader
 *
 * Suspense境界内で使用する。データをフェッチし、ArticlesStackに渡す。
 *
 * @example
 * <Suspense fallback={<Loading />}>
 *   <ArticlesStackLoader variant="exported" loadMoreAction={loadMoreExportedArticles} />
 * </Suspense>
 */
export async function ArticlesStackLoader({
  variant,
  deleteAction,
  loadMoreAction,
}: ArticlesStackLoaderProps) {
  const getData = variant === "exported" ? getExportedArticles : getUnexportedArticles;

  // ここでSuspenseがトリガーされる
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

### 詳細ページ用Loader

```typescript
// app/src/loaders/notes/note-viewer-loader.tsx
import "server-only";

import { notFound } from "next/navigation";
import { getNoteByTitle } from "@/application-services/notes/get-notes";
import { ViewerBody } from "@/components/notes/server/viewer-body";
import type { DetailLoaderProps } from "@/loaders/types";

export async function NoteViewerLoader({ slug }: DetailLoaderProps) {
  const decodedSlug = decodeURIComponent(slug);
  const note = await getNoteByTitle(decodedSlug);

  if (!note) {
    notFound();
  }

  return <ViewerBody note={note} />;
}
```

### フォーム用Loader

```typescript
// app/src/loaders/articles/article-form-loader.tsx
import "server-only";

import { getCategories } from "@/application-services/articles/get-articles";
import type { ServerAction } from "@/common/types";
import { ArticleForm } from "@/components/articles/server/article-form";
import type { BaseLoaderProps } from "@/loaders/types";

export type ArticleFormLoaderProps = BaseLoaderProps & {
  addArticle: (formData: FormData) => Promise<ServerAction>;
};

export async function ArticleFormLoader({ addArticle }: ArticleFormLoaderProps) {
  const categories = await getCategories();

  return <ArticleForm addArticle={addArticle} categories={categories} />;
}
```

## Suspense境界の配置

### 基本パターン（ページレベル）

```typescript
// app/src/app/[locale]/(dumper)/@articles/page.tsx
import { Suspense } from "react";
import Loading from "@s-hirano-ist/s-ui/display/loading";
import { ErrorPermissionBoundary } from "@/components/common/layouts/error-permission-boundary";
import { ArticlesStackLoader } from "@/loaders/articles";

export default async function Page() {
  return (
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
  );
}
```

### 並列ローディング（複数Loader）

```typescript
export default async function Page() {
  return (
    <>
      {/* カウンターは独立してロード */}
      <ErrorPermissionBoundary
        errorCaller="ArticlesCounter"
        permissionCheck={hasViewerAdminPermission}
        render={() => <ArticlesCounterLoader variant="exported" />}
      />

      {/* フォームは独立してロード */}
      <ErrorPermissionBoundary
        errorCaller="ArticleForm"
        permissionCheck={hasDumperPostPermission}
        render={() => <ArticleFormLoader submitAction={addArticle} />}
      />

      {/* スタックは独立してロード */}
      <Suspense fallback={<Loading />}>
        <ErrorPermissionBoundary
          errorCaller="ArticlesStack"
          permissionCheck={hasViewerAdminPermission}
          render={() => (
            <ArticlesStackLoader
              variant="unexported"
              deleteAction={deleteArticle}
              loadMoreAction={loadMoreUnexportedArticles}
            />
          )}
        />
      </Suspense>
    </>
  );
}
```

## Server Componentの変更

### Before（現在のパターン）

```typescript
// データ取得関数をpropsで受け取り、内部でawait
export async function ArticlesStack({
  getArticles,
  deleteArticle,
  loadMoreAction,
}: Props) {
  const articles = await getArticles(0);  // 内部でデータ取得

  return (
    <LinkCardStack
      initial={articles}
      deleteAction={deleteArticle}
      loadMoreAction={loadMoreAction}
    />
  );
}
```

### After（Loader Pattern）

```typescript
// データをpropsで直接受け取る（非async）
export function ArticlesStack({
  initialData,
  deleteAction,
  loadMoreAction,
}: Props) {
  return (
    <LinkCardStack
      initial={initialData}
      deleteAction={deleteAction}
      loadMoreAction={loadMoreAction}
    />
  );
}
```

## エラーハンドリング

Loader内ではエラーをcatchしない。ErrorBoundaryに伝播させる。

```typescript
// 正しい: エラーを伝播
export async function ArticlesStackLoader({ variant }: Props) {
  const data = await getData(0);  // エラーは親のErrorBoundaryへ
  return <ArticlesStack initialData={data} />;
}
```

```typescript
// 間違い: Loader内でcatchしない
export async function ArticlesStackLoader({ variant }: Props) {
  try {
    const data = await getData(0);
    return <ArticlesStack initialData={data} />;
  } catch (error) {
    return <ErrorComponent />;  // NG - ErrorBoundaryを使う
  }
}
```

## 責務の分離

| レイヤー | 責務 | 例 |
|---------|------|-----|
| Application Services | キャッシュ、データ変換、ユーザーコンテキスト | `getExportedArticles` |
| Loaders | データ取得の実行、Suspense連携 | `ArticlesStackLoader` |
| Server Components | プレゼンテーション、データの表示 | `ArticlesStack` |
| Client Components | インタラクティブ機能、状態管理 | `LinkCardStack` |

## re-exportパターン

```typescript
// app/src/loaders/articles/index.ts
export { ArticlesStackLoader } from "./articles-stack-loader";
export { ArticlesCounterLoader } from "./articles-counter-loader";
export { ArticleFormLoader } from "./article-form-loader";

export type { ArticlesStackLoaderProps } from "./articles-stack-loader";
export type { ArticlesCounterLoaderProps } from "./articles-counter-loader";
export type { ArticleFormLoaderProps } from "./article-form-loader";
```

## Fallbackコンポーネント

```typescript
// 汎用Loading
import Loading from "@s-hirano-ist/s-ui/display/loading";

// 特定コンポーネント用Skeleton
export function ArticlesStackSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
```
