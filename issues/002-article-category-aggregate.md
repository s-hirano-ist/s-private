# 002: Article-Category の集約境界

## 優先度: 高

## 概要

Article-Category間の集約境界が不明確で、ドメインモデルとDBスキーマの間に不整合がある。

## 現状

- **ドメイン**: `categoryName`（値オブジェクト）を保持
- **DB**: `categoryId`（FK）で別テーブル参照
- **リポジトリ**: `connectOrCreate`による暗黙的なCategory管理

## 問題点

- 集約の粒度がDBスキーマに引きずられている
- `categoryId`と`categoryName`の二重保持が冗長
- Categoryの管理責任が曖昧

## 対象ファイル

- `packages/core/articles/entities/article-entity.ts`
- `app/src/infrastructures/articles/repositories/articles-command-repository.ts`
- `packages/database/prisma/schema.prisma`

## 改善案

### 選択肢A: CategoryをArticle集約内に完全包含

```typescript
// categoryIdを削除し、categoryNameのみに
const Base = z.object({
  id: Id,
  title: ArticleTitle,
  url: Url,
  categoryName: CategoryName,  // これのみ保持
  // categoryId: 削除
});
```

**メリット:**
- シンプルな集約構造
- ドメインモデルがDBスキーマから独立

**デメリット:**
- Category単体のクエリが非効率になる可能性

### 選択肢B: Categoryを独立した集約として明確化

```typescript
// packages/core/categories/entities/category-entity.ts (新規作成)
export const CategoryId = z.string().uuid().brand<"CategoryId">();
export const CategoryName = z.string().min(1).max(16).brand<"CategoryName">();

export const Category = z.object({
  id: CategoryId,
  name: CategoryName,
});

// ArticleはcategoryIdのみを保持（参照ID）
const Base = z.object({
  id: Id,
  title: ArticleTitle,
  url: Url,
  categoryId: CategoryId,  // 参照のみ
});
```

**メリット:**
- 集約境界が明確
- Category単体の管理が可能

**デメリット:**
- 実装が複雑になる
- 新しいドメインディレクトリが必要

## 推奨

**選択肢A**を推奨。現在の使用パターンを考慮すると、CategoryはArticleの属性として扱う方が自然。

## 検証方法

1. 選択肢を決定後、エンティティ定義を修正
2. リポジトリの実装を更新
3. `pnpm test` で既存テストがパスすることを確認
4. `pnpm build` でTypeScriptエラーがないことを確認
