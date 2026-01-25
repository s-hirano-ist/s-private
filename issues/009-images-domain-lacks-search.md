# Issue 009: Imagesドメインにsearch機能が欠落

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | インターフェース一貫性 / 集約設計 |
| **対象ファイル** | `packages/core/images/repositories/images-query-repository.interface.ts` |

## 現状

他のドメインには `search()` メソッドが存在しますが、Imagesドメインには存在しません。

```typescript
// Articles - searchあり
export interface IArticlesQueryRepository {
  search(query: string, userId: UserId): Promise<Article[]>;
}

// Books - searchあり
export interface IBooksQueryRepository {
  search(query: string, userId: UserId): Promise<Book[]>;
}

// Notes - searchあり
export interface INotesQueryRepository {
  search(query: string, userId: UserId): Promise<Note[]>;
}

// Images - searchなし
export interface IImagesQueryRepository {
  findById(id: Id): Promise<Image | null>;
  findMany(userId: UserId): Promise<Image[]>;
  // search() が存在しない
}
```

## 問題点

- リポジトリインターフェースの一貫性がない
- Imagesドメインでの検索機能が提供されていない（タグやdescriptionでの検索が有用な可能性）

## 改善案

### Option A: search機能を追加

```typescript
export interface IImagesQueryRepository {
  findById(id: Id): Promise<Image | null>;
  findMany(userId: UserId): Promise<Image[]>;
  search(query: string, userId: UserId): Promise<Image[]>;  // 追加
}
```

検索対象:
- タグ（存在する場合）
- 説明文（description）
- ファイル名

### Option B: 意図的な除外として明示化

Imagesドメインでは検索が不要である場合、その理由をドキュメントに明記：

```typescript
/**
 * Images Query Repository
 *
 * Note: search() is intentionally omitted because:
 * - Images are primarily accessed by ID or listed by user
 * - No meaningful text content to search (unlike articles, notes, books)
 */
export interface IImagesQueryRepository {
  findById(id: Id): Promise<Image | null>;
  findMany(userId: UserId): Promise<Image[]>;
}
```

## 推奨

プロジェクトの要件に応じて判断：
- 画像にタグや説明文がある場合 → **Option A**
- 画像は単純なファイルストレージとして使用 → **Option B**

## 影響範囲

Option Aの場合:
- `packages/core/images/repositories/images-query-repository.interface.ts`
- リポジトリ実装クラス
- 検索用のローダー/API追加

Option Bの場合:
- インターフェースファイルにコメント追加のみ

## 実装手順

### Option A
1. `IImagesQueryRepository` に `search()` を追加
2. 実装クラスに検索ロジックを実装
3. Prismaクエリを作成
4. `pnpm build` で確認
5. `pnpm test` で確認

### Option B
1. インターフェースファイルにJSDocコメントを追加
2. `docs/domain-model.md` に意図的な除外として記載
