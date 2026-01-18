# 004: リポジトリ戻り値型の統一

## 優先度: 中

## 概要

QueryRepositoryの戻り値型が統一されておらず、エンティティ型ではなく部分的なDTO型を返している箇所がある。

## 現状

- QueryRepositoryがエンティティ型ではなく部分的なDTO型を返す
- エンティティ再構築パターンが一貫していない
- ドメイン層とインフラ層の境界が曖昧

## 問題点

- 戻り値の型が予測しにくい
- アプリケーションサービスでの型変換が必要になる場合がある
- DDDのリポジトリパターンの原則（集約を返す）から逸脱

## 対象ファイル

- `app/src/infrastructures/articles/repositories/articles-query-repository.ts`
- `packages/core/articles/repositories/articles-query-repository.ts`（インターフェース）

## 改善案

### 戻り値を統一されたエンティティ型に

```typescript
// インターフェース定義
export interface IArticlesQueryRepository {
  // 単一エンティティを返す
  findByUrl(url: Url, userId: UserId): Promise<UnexportedArticle | ExportedArticle | null>;

  // コレクションを返す
  findAllUnexported(userId: UserId): Promise<UnexportedArticle[]>;
  findAllExported(userId: UserId): Promise<ExportedArticle[]>;

  // 特定フィールドのみが必要な場合は明示的なDTO型を定義
  findTitlesForExport(userId: UserId): Promise<ArticleTitleDTO[]>;
}

// DTO型の例
export interface ArticleTitleDTO {
  id: Id;
  title: ArticleTitle;
}
```

### リポジトリ実装でのエンティティ再構築

```typescript
// articles-query-repository.ts
async findByUrl(url: Url, userId: UserId): Promise<UnexportedArticle | ExportedArticle | null> {
  const data = await prisma.article.findUnique({
    where: { url, userId },
  });

  if (!data) return null;

  // Prismaモデル → ドメインエンティティへの変換
  return this.toEntity(data);
}

private toEntity(data: PrismaArticle): UnexportedArticle | ExportedArticle {
  if (data.status === "EXPORTED") {
    return Object.freeze({
      id: makeId(data.id),
      title: makeArticleTitle(data.title),
      url: makeUrl(data.url),
      categoryName: makeCategoryName(data.category.name),
      status: "EXPORTED" as const,
      exportedAt: makeExportedAt(data.exportedAt!),
    });
  }
  // ... UnexportedArticleの場合
}
```

## 期待される効果

- 戻り値の型が予測可能に
- アプリケーションサービスでの型変換が不要
- DDDリポジトリパターンの原則に準拠

## 検証方法

1. インターフェース定義を更新
2. リポジトリ実装を更新
3. `pnpm build` でTypeScriptエラーがないことを確認
4. `pnpm test` で既存テストがパスすることを確認
