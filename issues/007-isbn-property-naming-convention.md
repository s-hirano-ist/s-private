# Issue 007: ISBNプロパティの命名規則不統一

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | ユビキタス言語 - 命名の一貫性 |
| **対象ファイル** | `packages/core/books/entities/book-entity.ts` |

## 現状

```typescript
const Base = z.object({
  id: Id,
  userId: UserId,
  ISBN: ISBN,        // ← 全て大文字（PascalCase）
  title: BookTitle,
  memo: Memo,
  // ...
});
```

`ISBN` プロパティのみが全て大文字（PascalCase）で、他のプロパティ（camelCase）と命名規則が不統一です。

## 問題点

- プロパティ命名の一貫性が損なわれる
- コードベース全体でcamelCaseを使用しているため、例外が混乱を招く
- TypeScriptの一般的な慣習（プロパティはcamelCase）に反する

## 改善案

プロパティ名を camelCase に変更：

```typescript
const Base = z.object({
  id: Id,
  userId: UserId,
  isbn: ISBN,        // ← camelCaseに変更（型名のISBNはそのまま）
  title: BookTitle,
  memo: Memo,
  // ...
});
```

**注**: 値オブジェクトの型名 `ISBN` は固有名詞として大文字のままで問題ありません。変更するのはプロパティ名のみです。

## 影響範囲

- `packages/core/books/entities/book-entity.ts`
- Bookエンティティを使用する全てのファイル
- Prismaスキーマ（データベースカラム名）
- APIレスポンス（フロントエンドとの整合性）

## 実装手順

1. `book-entity.ts` のプロパティ名を `isbn` に変更
2. 関連ファイルの参照を更新
3. Prismaスキーマを確認（必要に応じてマイグレーション）
4. `pnpm build` で確認
5. `pnpm test` で確認
