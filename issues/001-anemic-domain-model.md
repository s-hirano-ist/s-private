# Issue 001: Anemic Domain Model

## 重要度: 中

## 概要

Entity/Value Objectに振る舞い（ビジネスメソッド）がなく、ビジネスロジックがApplication Service（Core関数）に集中している。

## 現状

- `articleEntity.create()` のみ実装
- 更新・状態遷移ロジックがApplication Service（Core関数）に集中
- Value ObjectはZodスキーマによるバリデーションのみ

## 対象ファイル

- `packages/core/articles/entities/article-entity.ts`
- `packages/core/books/entities/books-entity.ts`
- `packages/core/notes/entities/note-entity.ts`
- `packages/core/images/entities/image-entity.ts`

## 問題点

DDDの観点から、Entityはデータの入れ物ではなく、ドメインの振る舞いをカプセル化すべきである。現状のAnemic Domain Modelでは：

1. **ビジネスルールの分散**: 更新ロジックがRepository操作やApplication Serviceに分散
2. **不変条件の保証困難**: Entity外で更新が行われるため、整合性チェックが漏れる可能性
3. **テスタビリティ低下**: ビジネスロジックがインフラ層に依存

## 改善候補

```typescript
// 例: articleEntityに追加すべきメソッド
export const articleEntity = {
  create: (...) => ...,

  // OGメタデータ更新
  updateOgMetadata: (article: UnexportedArticle, og: OgMetadata): UnexportedArticle => {
    // バリデーション + 不変条件チェック
    return { ...article, ogMetadata: og };
  },

  // 状態遷移（必要に応じて）
  export: (article: UnexportedArticle): ExportedArticle => {
    // エクスポート条件のチェック
    return { ...article, status: 'EXPORTED' };
  },
};
```

## 実装方針

1. 各EntityにCRUD以外のビジネスメソッドを追加
2. Application Serviceからビジネスロジックを移動
3. Entity内で不変条件をチェック

## 関連

- `docs/domain-model.md` の意図的逸脱（001）: バッチ処理のステータス更新は許容

## 参考

- Martin Fowler: [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
