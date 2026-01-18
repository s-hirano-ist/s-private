# 001: 状態遷移ルールの分散

## 優先度: 高

## 概要

状態遷移ロジックがエンティティ外のバッチサービスに分散しており、不正な状態遷移を型レベルで防げない問題。

## 現状

```typescript
// articles-batch-domain-service.ts
// 状態遷移ロジックがバッチサービスに分散
UNEXPORTED → LAST_UPDATED → EXPORTED
```

## 問題点

- 状態遷移ルールがエンティティ外に存在
- 不正な状態遷移を型レベルで防げない
- DDDの原則（エンティティがビジネスルールを持つ）に反する

## 対象ファイル

- `packages/core/articles/services/articles-batch-domain-service.ts`
- `packages/core/articles/entities/article-entity.ts`

## 改善案

エンティティに状態遷移メソッドを追加し、型レベルで遷移を強制する：

```typescript
// article-entity.ts に追加
const articleEntity = {
  // 既存のcreate, update, delete...

  markAsLastUpdated: (article: UnexportedArticle): LastUpdatedArticle => {
    return Object.freeze({
      ...article,
      status: "LAST_UPDATED" as const,
    });
  },

  markAsExported: (article: LastUpdatedArticle): ExportedArticle => {
    return Object.freeze({
      ...article,
      status: "EXPORTED" as const,
      exportedAt: makeExportedAt(),
    });
  },
};
```

## 期待される効果

- 状態遷移ルールがエンティティに集約される
- 型レベルで不正な遷移をコンパイルエラーにできる
- ドメインロジックの可読性向上

## 検証方法

1. `pnpm test` で既存テストがパスすることを確認
2. `pnpm build` でTypeScriptエラーがないことを確認
3. バッチサービスから状態遷移ロジックを削除し、エンティティメソッドに置き換え
