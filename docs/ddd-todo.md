# docs/domain-model.md レビュー結果

## 概要

`docs/domain-model.md` を実際のコード実装と照らし合わせてレビューしました。
以下の問題点を修正しました。

## 修正済み問題点

### 1. ファイルパスの不一致（重要度: 高）✅

**修正内容**:
- `src/domains/` → `packages/core/` に全箇所で修正

### 2. Status ライフサイクル図の矛盾（重要度: 高）✅

**修正内容**:
共通ライフサイクル図を以下のように更新:
```
UNEXPORTED → LAST_UPDATED → EXPORTED
LAST_UPDATED → UNEXPORTED (revert)
```

### 3. Article エンティティの categoryId 記載（重要度: 中）✅

**修正内容**:
ER図から `Id categoryId FK` を削除（ドメインエンティティには存在せず、DB層のみ）

### 4. ER図の冗長な関係記述（重要度: 低）✅

**修正内容**:
```mermaid
Category ||--o{ Article : "has many"
```
のみに修正

### 5. OgImageUrl の欠落（重要度: 低）✅

**修正内容**:
ER図およびValue Objectsリストに `OgImageUrl ogImageUrl "nullable"` を追加

### 6. Images バッチサービスの言及漏れ（重要度: 低）✅

**修正内容**:
対象ファイルに以下を追加:
- `packages/core/images/services/images-batch-domain-service.ts`

### 7. Application Service パスの不一致（重要度: 中）✅

**修正内容**:
パスを `app/src/application-services/{domain}/` に修正

## 追加の修正

### Status enum の定義更新

実装に合わせて `UNEXPORTED | LAST_UPDATED | EXPORTED` に修正

### 集約の不変条件の一貫性

全集約のステータス遷移を `UNEXPORTED → LAST_UPDATED → EXPORTED` に統一

### Image集約の重複チェック

`ImagesDomainService.ensureNoDuplicate` による検証を明記

## 修正対象ファイル

- `docs/domain-model.md`

## 参照した実装ファイル

- `packages/core/common/entities/common-entity.ts`
- `packages/core/articles/entities/article-entity.ts`
- `packages/core/articles/services/articles-batch-domain-service.ts`
- `packages/core/images/services/images-batch-domain-service.ts`
- `app/src/application-services/articles/add-article.ts`
- `packages/database/prisma/schema.prisma`
