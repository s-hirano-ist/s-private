# DDD-005: Article エンティティにおけるデータの非正規化

## 概要

Article エンティティが `categoryId`（外部キー）と `categoryName`（値のコピー）の両方を保持しており、データの不整合リスクがある。

## 問題箇所

`packages/core/articles/entities/article-entity.ts:315-327`

```typescript
const Base = z.object({
  categoryId: Id,           // FK参照
  categoryName: CategoryName,  // 値のコピー（非正規化）
  ...
});
```

## DDDの原則との乖離

- Article が `categoryId`（外部キー）と `categoryName`（値のコピー）の両方を保持している
- Category の name が変更された場合、Article 内の categoryName との整合性が取れなくなる可能性がある
- `docs/domain-model.md:232` では「表示用」と説明されているが、これはエンティティの責務ではなくDTOの責務

## 影響

- **データ不整合リスク**: Category.name 更新時に Article.categoryName が古い値のまま残る
- **集約境界の曖昧さ**: Article と Category の依存関係が不明確
- **更新コストの増加**: Category 名変更時に関連する全 Article の更新が必要

## 推奨対応

### 案1: エンティティから categoryName を削除（推奨）

```typescript
const Base = z.object({
  categoryId: Id,  // FK参照のみ
  // categoryName を削除
  ...
});
```

`ArticleListItemDTO` で categoryName を JOIN して取得:

```typescript
// Query Repository で JOIN
findMany(): Promise<ArticleListItemDTO[]> {
  // SELECT a.*, c.name as categoryName FROM articles a JOIN categories c ...
}
```

### 案2: categoryName の不変性をビジネスルールとして明確化

Category の name は変更不可というルールを `docs/domain-model.md` に明記し、技術的な制約（DB の制約等）で保護。

### 案3: 現状維持（非推奨）

「表示用のスナップショット」という設計意図を明確にドキュメント化し、不整合を許容。

## 優先度

中

## 関連ファイル

- `packages/core/articles/entities/article-entity.ts`
- `packages/core/articles/repositories/articles-query-repository.interface.ts`
- `docs/domain-model.md`
