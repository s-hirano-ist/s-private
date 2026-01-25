# Issue 011: 共有カーネル型にドメイン固有フィールド

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Medium |
| **DDD原則** | 共有カーネルパターン / 開放閉鎖原則（OCP） |
| **対象ファイル** | `packages/core/shared-kernel/types/search-types.ts` |

## 現状

```typescript
export type SearchResult = {
  href: string;
  contentType: ContentType;
  title: string;
  snippet: string;
  url?: string;              // articles only
  rating?: number | null;    // books only
  tags?: string[];           // books only
  category?: { id: string; name: string }; // articles only
};
```

`SearchResult` 型に、特定のドメイン（articles, books）でのみ使用されるオプショナルフィールドが混在しています。

## 問題点

1. **共有カーネルパターン違反**: 共有カーネルは真に共通の概念のみを含むべきであり、ドメイン固有のフィールドを持つべきではない

2. **開放閉鎖原則（OCP）違反**: 新しいドメイン（例：videos）を追加する際、この共有型を変更する必要がある
   ```typescript
   // videos ドメイン追加時、shared-kernel を修正する必要がある
   export type SearchResult = {
     // ... 既存フィールド
     duration?: number;  // videos only - 変更が必要
   };
   ```

3. **型安全性の低下**: どのフィールドがどのコンテンツタイプで利用可能かがコンパイル時に検証されない
   ```typescript
   const result: SearchResult = {
     contentType: "notes",
     // rating, tags を設定しても型エラーにならない（notes では無効なはず）
     rating: 5,
     tags: ["invalid"],
   };
   ```

4. **ドメイン間の結合**: articles ドメインの変更（category 構造の変更など）が shared-kernel に影響を与える

## 改善案

### Step 1: 基本型を定義

```typescript
// packages/core/shared-kernel/types/search-types.ts
export type BaseSearchResult = Readonly<{
  href: string;
  contentType: ContentType;
  title: string;
  snippet: string;
}>;
```

### Step 2: 各ドメインに固有の検索結果型を定義

```typescript
// packages/core/articles/types/search-types.ts
import type { BaseSearchResult } from "@core/shared-kernel/types/search-types.js";

export type ArticleSearchResult = BaseSearchResult & Readonly<{
  contentType: "articles";
  url: string;
  category: { id: string; name: string };
}>;
```

```typescript
// packages/core/books/types/search-types.ts
import type { BaseSearchResult } from "@core/shared-kernel/types/search-types.js";

export type BookSearchResult = BaseSearchResult & Readonly<{
  contentType: "books";
  rating: number | null;
  tags: string[];
}>;
```

```typescript
// packages/core/notes/types/search-types.ts
import type { BaseSearchResult } from "@core/shared-kernel/types/search-types.js";

export type NoteSearchResult = BaseSearchResult & Readonly<{
  contentType: "notes";
}>;
```

### Step 3: 判別共用体（Discriminated Union）を定義

```typescript
// packages/core/shared-kernel/types/search-types.ts
import type { ArticleSearchResult } from "@core/articles/types/search-types.js";
import type { BookSearchResult } from "@core/books/types/search-types.js";
import type { NoteSearchResult } from "@core/notes/types/search-types.js";

export type SearchResult =
  | ArticleSearchResult
  | BookSearchResult
  | NoteSearchResult;
```

### Step 4: 型ガードを活用

```typescript
function isBookSearchResult(result: SearchResult): result is BookSearchResult {
  return result.contentType === "books";
}

// 使用例
if (isBookSearchResult(result)) {
  console.log(result.rating);  // 型安全にアクセス可能
  console.log(result.tags);    // 型安全にアクセス可能
}
```

## 影響範囲

- `packages/core/shared-kernel/types/search-types.ts` の修正
- 各ドメインに検索結果型ファイルを追加
  - `packages/core/articles/types/search-types.ts`
  - `packages/core/books/types/search-types.ts`
  - `packages/core/notes/types/search-types.ts`
- `app/src/application-services/search/search-content.ts` の修正
- 検索結果を使用するUI コンポーネント

## 実装手順

1. `BaseSearchResult` 型を shared-kernel に定義
2. 各ドメインに固有の検索結果型を定義
3. 判別共用体 `SearchResult` を更新
4. 必要に応じて型ガード関数を追加
5. `search-content.ts` で各ドメインの型を使用するよう修正
6. `pnpm build` で型エラーがないことを確認
7. `pnpm test` でテストが通ることを確認

## 参考資料

- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [DDD Shared Kernel Pattern](https://www.domainlanguage.com/ddd/reference/)
