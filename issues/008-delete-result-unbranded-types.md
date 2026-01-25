# Issue 008: DeleteResult型が非ブランド型を使用

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | 値オブジェクト / 型安全性 |
| **対象ファイル** | 各ドメインの `command-repository.interface.ts` |

## 現状

```typescript
// packages/core/articles/repositories/articles-command-repository.interface.ts
export type DeleteArticleResult = { title: string };  // ArticleTitleではない

// packages/core/books/repositories/books-command-repository.interface.ts
export type DeleteBookResult = { title: string };     // BookTitleではない

// packages/core/notes/repositories/notes-command-repository.interface.ts
export type DeleteNoteResult = { title: string };     // NoteTitleではない
```

削除結果の `title` プロパティが生の `string` 型であり、対応するブランド型を使用していません。

## 問題点

- 型安全性が低下する
- 異なるドメインの `title` が混同される可能性がある
- ブランド型による型チェックの恩恵を受けられない

## 改善案

各ドメインのブランド型を使用：

```typescript
// packages/core/articles/repositories/articles-command-repository.interface.ts
import { ArticleTitle } from "../value-objects/article-title";
export type DeleteArticleResult = { title: ArticleTitle };

// packages/core/books/repositories/books-command-repository.interface.ts
import { BookTitle } from "../value-objects/book-title";
export type DeleteBookResult = { title: BookTitle };

// packages/core/notes/repositories/notes-command-repository.interface.ts
import { NoteTitle } from "../value-objects/note-title";
export type DeleteNoteResult = { title: NoteTitle };
```

## 影響範囲

- 各ドメインの `command-repository.interface.ts`
- リポジトリ実装クラス
- 削除操作を呼び出すサービス・ローダー

## 実装手順

1. 各 `DeleteResult` 型にブランド型をインポート
2. `title` プロパティの型を変更
3. 実装クラスで適切にキャスト
4. `pnpm build` で確認
5. `pnpm test` で確認
