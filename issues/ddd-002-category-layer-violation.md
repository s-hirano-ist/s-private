# DDD-002: Category FK解決ロジックのレイヤー違反

## 優先度
**Medium**

## 概要
Articles ドメインのリポジトリ実装において、`connectOrCreate` によるカテゴリの存在確認と作成がリポジトリ層で行われている。DDD の原則では、リポジトリはデータの永続化のみを担当すべきであり、このロジックはアプリケーション層に配置すべき。

## 問題点
リポジトリ層にビジネスロジック（カテゴリの存在確認と新規作成）が混在している。

### 現状のコード

**`app/src/infrastructures/articles/repositories/articles-command-repository.ts:28-42`**
```typescript
async function create(data: UnexportedArticle): Promise<void> {
  await prisma.article.create({
    data: {
      // ... other fields
      Category: {
        connectOrCreate: {
          where: {
            name_userId: {
              name: data.categoryName,
              userId: data.userId,
            },
          },
          create: {
            name: data.categoryName,
            userId: data.userId,
            id: uuidv7(),
            createdAt: data.createdAt,
          },
        },
      },
      // ...
    },
  });
}
```

## DDDの観点からの問題

1. **リポジトリの責務逸脱**: リポジトリは「エンティティの永続化と取得」のみを担当すべき
2. **ビジネスロジックの分散**: カテゴリの存在確認と作成はドメインサービスまたはアプリケーションサービスの責務
3. **テスタビリティ低下**: リポジトリ内のロジックは単体テストしにくい

## 現状の設計判断

この設計は `docs/domain-model.md:231` に文書化されており、以下の理由で採用されている：

- Prisma の `connectOrCreate` を活用することでパフォーマンスが向上
- トランザクション管理がシンプル
- 現状の規模では問題が発生していない

## 修正案（DDDを厳密に適用する場合）

### 1. CategoryService の新設
**ファイル**: `packages/core/articles/services/category-service.ts`

```typescript
export type ICategoryService = {
  resolveOrCreate(
    categoryName: string,
    userId: UserId,
  ): Promise<CategoryId>;
};
```

### 2. Application Service での解決
**ファイル**: `app/src/application-services/articles/add-article.core.ts`

```typescript
export async function addArticleCore(
  input: AddArticleInput,
  deps: AddArticleDeps,
) {
  // 1. カテゴリを解決（存在確認 or 作成）
  const categoryId = await deps.categoryService.resolveOrCreate(
    input.categoryName,
    input.userId,
  );

  // 2. 記事エンティティを作成（categoryId を使用）
  const [article, event] = articleEntity.create({
    ...input,
    categoryId,
  });

  // 3. 永続化
  await deps.articlesCommandRepository.create(article);
}
```

### 3. リポジトリから connectOrCreate を削除
**ファイル**: `app/src/infrastructures/articles/repositories/articles-command-repository.ts`

```typescript
async function create(data: UnexportedArticle): Promise<void> {
  await prisma.article.create({
    data: {
      // categoryId を直接使用（connectOrCreate 不要）
      categoryId: data.categoryId,
      // ...
    },
  });
}
```

## 影響範囲
- `packages/core/articles/entities/article-entity.ts` - エンティティに categoryId を追加
- `packages/core/articles/services/category-service.ts` - 新規作成
- `app/src/infrastructures/articles/repositories/articles-command-repository.ts` - connectOrCreate 削除
- `app/src/application-services/articles/add-article.core.ts` - カテゴリ解決呼び出し追加
- `app/src/application-services/articles/add-article.deps.ts` - 依存性追加

## 推奨事項
現行設計でも動作上の問題はないため、以下の場合にのみ修正を検討：

1. DDDの純粋性を重視するプロジェクト方針の場合
2. カテゴリ関連のビジネスロジックが複雑化した場合
3. 新規開発者への説明コストが問題になった場合

## 関連ドキュメント
- `docs/domain-model.md:231` - 設計判断の文書化
- `docs/architecture.md` - アーキテクチャ概要
