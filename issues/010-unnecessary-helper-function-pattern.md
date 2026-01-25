# Issue 010: ドメインサービスの不要なヘルパー関数パターン

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | クリーンコード |
| **対象ファイル** | 各ドメインの `domain-service.ts` |

## 現状

ドメインサービスで、クラスメソッドが単にファイルスコープのヘルパー関数を呼び出すだけのパターンが存在します。

```typescript
// 不要な間接化の例
async function ensureNoDuplicateArticle(
  url: URL,
  userId: UserId,
  repository: IArticlesQueryRepository
): Promise<void> {
  const existing = await repository.findByUrl(url, userId);
  if (existing) {
    throw new DomainError("Article with this URL already exists");
  }
}

class ArticlesDomainService {
  async ensureNoDuplicate(
    url: URL,
    userId: UserId,
    repository: IArticlesQueryRepository
  ): Promise<void> {
    // 単にヘルパー関数を呼び出すだけ
    return ensureNoDuplicateArticle(url, userId, repository);
  }
}
```

## 問題点

- **不要な間接化**: クラスメソッドがヘルパー関数をラップするだけで付加価値がない
- **可読性の低下**: コードを追う際に2箇所を確認する必要がある
- **保守性の低下**: 同じロジックが2箇所に分散している印象を与える

## 改善案

クラスメソッド内で直接実装：

```typescript
class ArticlesDomainService {
  async ensureNoDuplicate(
    url: URL,
    userId: UserId,
    repository: IArticlesQueryRepository
  ): Promise<void> {
    const existing = await repository.findByUrl(url, userId);
    if (existing) {
      throw new DomainError("Article with this URL already exists");
    }
  }
}
```

## 例外ケース

以下の場合はヘルパー関数パターンが適切：
- 複数のメソッドで共有されるロジック
- テスト用にモック可能にしたい場合
- 再帰処理など、独立した関数として定義する方が自然な場合

## 影響範囲

- `packages/core/articles/services/articles-domain-service.ts`
- `packages/core/books/services/books-domain-service.ts`
- `packages/core/notes/services/notes-domain-service.ts`
- `packages/core/images/services/images-domain-service.ts`

## 実装手順

1. 各ドメインサービスファイルを確認
2. 単一メソッドからのみ呼び出されるヘルパー関数を特定
3. ヘルパー関数のロジックをクラスメソッドにインライン化
4. 不要になったヘルパー関数を削除
5. `pnpm build` で確認
6. `pnpm test` で確認
