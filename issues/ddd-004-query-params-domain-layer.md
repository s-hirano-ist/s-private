# DDD-004: Query Parametersのドメイン層配置を修正

## 概要

ページネーション（`take`/`skip`）やキャッシュ戦略（`cacheStrategy`）といったインフラストラクチャ関心事がドメイン層に存在している。DDDの原則では、ドメイン層はテクノロジーに依存しないべきである。

## 重要度

**MEDIUM** - 関心事の分離に関する問題

## 現状

### ドメイン層の型定義（packages/core/\*/types/query-params.ts）

```typescript
// packages/core/articles/types/query-params.ts
export type ArticlesFindManyParams = {
  orderBy?: ArticleOrderBy;       // ドメイン関心事
  take?: number;                  // インフラ関心事
  skip?: number;                  // インフラ関心事
  cacheStrategy?: CacheStrategy;  // インフラ関心事
};
```

## 問題点

1. **関心事の混在**
   - `orderBy`（ドメイン：どのフィールドでソートするか）
   - `take`/`skip`（インフラ：データベースのページネーション）
   - `cacheStrategy`（インフラ：Next.jsのキャッシュ制御）

2. **DDD原則違反**
   - ドメイン層はテクノロジーに依存しない設計が原則
   - ページネーションはDBの実装詳細
   - キャッシュ戦略はフレームワーク固有の概念

3. **依存性逆転の原則との矛盾**
   - `CacheStrategy`型がドメイン層にimportされている
   - これによりドメイン層がインフラ概念に依存

## 対象ファイル

### 現在の型定義（ドメイン層）

- `packages/core/articles/types/query-params.ts`
- `packages/core/books/types/query-params.ts`
- `packages/core/notes/types/query-params.ts`
- `packages/core/images/types/query-params.ts`

### リポジトリインターフェース（ドメイン層）

- `packages/core/articles/repositories/articles-query-repository.interface.ts`
- `packages/core/books/repositories/books-query-repository.interface.ts`
- `packages/core/notes/repositories/notes-query-repository.interface.ts`
- `packages/core/images/repositories/images-query-repository.interface.ts`

### リポジトリ実装（インフラ層）

- `app/src/infrastructures/articles/repositories/articles-query-repository.ts`
- `app/src/infrastructures/books/repositories/books-query-repository.ts`
- `app/src/infrastructures/notes/repositories/notes-query-repository.ts`
- `app/src/infrastructures/images/repositories/images-query-repository.ts`

## 推奨対応

### オプション A: 型の分離（推奨）

ドメイン関心事とインフラ関心事を別々の型に分離する。

```typescript
// packages/core/articles/types/query-params.ts（ドメイン層）
// ドメイン関心事のみ
export type ArticleOrderBy = { ... };

// app/src/infrastructures/shared/types/pagination.ts（インフラ層）
// インフラ関心事
export type PaginationParams = {
  take?: number;
  skip?: number;
};

export type CachingParams = {
  cacheStrategy?: CacheStrategy;
};

// app/src/infrastructures/articles/types/query-params.ts（インフラ層）
// リポジトリ実装が使用する合成型
import type { ArticleOrderBy } from "@repo/core/articles";
export type ArticlesFindManyParams = ArticleOrderBy & PaginationParams & CachingParams;
```

### オプション B: Repositoryインターフェースの引数を個別化

```typescript
// packages/core/articles/repositories/articles-query-repository.interface.ts（ドメイン層）
findMany(
  userId: UserId,
  status: Status,
  orderBy?: ArticleOrderBy  // ドメイン関心事のみ
): Promise<ArticleListItemDTO[]>;

// app/src/infrastructures/articles/repositories/articles-query-repository.ts（インフラ層）
// 実装側でpaginationとcachingを追加引数として受け取る（インターフェース拡張）
```

### オプション C: 意図的な逸脱として文書化

現状を維持し、`docs/domain-model.md`の「DDDからの意図的な逸脱」セクションに追加する。

理由：
- 個人プロジェクト規模では型の分散による複雑性増加のデメリットが大きい
- ページネーション・キャッシュは全クエリで必要なため、一箇所で管理した方が保守性が高い

## 影響範囲

- 型定義ファイル（4ドメイン）
- リポジトリインターフェース（4ドメイン）
- リポジトリ実装（4ドメイン）
- Application Service層のimport文

## 関連

- `docs/domain-model.md` - DDDからの意図的な逸脱セクション
- DDD-012（DIコンテナ・CQRS等の不採用）と同様の「オーバースペック回避」判断が適用可能
