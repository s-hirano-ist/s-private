# Issue 003: Entity更新パターン

## 重要度: 中

## 概要

Entity更新がRepository直接操作になっており、Entity側に更新メソッドがない。

## 現状

- OGメタデータ更新、タグ追加等の更新処理がEntity外で行われる
- 更新時の整合性チェックがEntity側にない
- Repositoryの`update`メソッドに生データを渡す形式

## 対象ファイル

- `packages/core/*/entities/*-entity.ts`（各ドメインのEntity）
- `app/src/infrastructures/*/repositories/*-command-repository.ts`

## 問題点

1. **カプセル化の欠如**: Entityの内部状態が外部から直接変更される
2. **不変条件の分散**: 更新時のバリデーションがRepository層やService層に分散
3. **ドメインイベントの欠落**: 状態変更に伴うドメインイベントを発行しにくい

## 改善候補

### Entity側に更新メソッドを追加

```typescript
// packages/core/articles/entities/article-entity.ts
export const articleEntity = {
  create: (...) => ...,

  // OGメタデータ更新（ドメインイベント付き）
  withOgMetadata: (
    article: UnexportedArticle,
    og: OgMetadata
  ): [UnexportedArticle, ArticleOgMetadataUpdatedEvent] => {
    // バリデーション
    if (!isValidOgMetadata(og)) {
      throw new InvalidOgMetadataError(og);
    }

    const updatedArticle = { ...article, ogMetadata: og };
    const event = { type: 'ArticleOgMetadataUpdated', articleId: article.id };

    return [updatedArticle, event];
  },

  // タグ追加
  addTag: (article: UnexportedArticle, tag: Tag): UnexportedArticle => {
    if (article.tags.includes(tag)) {
      return article; // 冪等性
    }
    return { ...article, tags: [...article.tags, tag] };
  },
};
```

### Serviceでの使用例

```typescript
// Application Service
async function updateArticleOgMetadata(articleId: ArticleId, og: OgMetadata) {
  const article = await repository.findById(articleId);
  const [updatedArticle, event] = articleEntity.withOgMetadata(article, og);

  await repository.save(updatedArticle);
  await eventPublisher.publish(event);
}
```

## 実装方針

1. 各Entityに更新メソッドを追加（`with*`, `add*`, `remove*`等）
2. 更新メソッド内で不変条件をチェック
3. 必要に応じてドメインイベントを返却
4. Application Serviceを更新メソッド呼び出しに変更

## 関連

- Issue 001: Anemic Domain Model（関連する課題）
- `docs/domain-model.md` 意図的逸脱（001）: バッチ処理のステータス更新は許容

## 注意

バッチ処理による一括ステータス更新は意図的な逸脱として許容されている。個別のEntity更新についてのみこのパターンを適用する。
