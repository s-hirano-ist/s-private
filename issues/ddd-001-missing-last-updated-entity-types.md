# DDD-001: LAST_UPDATED状態に対応するエンティティ型が存在しない

## 概要

ドメインモデルで定義されている3つの状態（UNEXPORTED → LAST_UPDATED → EXPORTED）のうち、LAST_UPDATED状態に対応するエンティティ型が各ドメインに存在しない。

## 重要度

**HIGH** - ドメインモデルの完全性に関わる問題

## 現状

### 状態の定義（common-entity.ts）

```typescript
export const UnexportedStatus = z.literal("UNEXPORTED");
export const LastUpdatedStatus = z.literal("LAST_UPDATED");  // 定義されている
export const ExportedStatus = z.object({
  status: z.literal("EXPORTED"),
  exportedAt: ExportedAt,
});

export type Status =
  | UnexportedStatus
  | LastUpdatedStatus           // 使用されている
  | ExportedStatus["status"];
```

### エンティティ型の定義（article-entity.ts等）

```typescript
// UnexportedとExportedのみ定義
export const UnexportedArticle = Base.extend({ status: UnexportedStatus });
export const ExportedArticle = Base.extend(ExportedStatus.shape);

// LastUpdatedArticleは存在しない
```

## 問題点

1. **型システムとデータベース状態の乖離**
   - データベースには`LAST_UPDATED`状態のレコードが存在しうる
   - しかし型システムでこの状態を表現できない

2. **バッチ処理時の型安全性喪失**
   - `IBatchCommandRepository.bulkUpdateStatus()`はLAST_UPDATEDへの遷移を行う
   - 戻り値やクエリ結果の型が正確でない

3. **ドメインモデルの不完全性**
   - ドキュメント（domain-model.md）では3状態を明示
   - コードでは2状態のみ表現

## 対象ファイル

- `packages/core/articles/entities/article-entity.ts`
- `packages/core/books/entities/book-entity.ts`
- `packages/core/notes/entities/note-entity.ts`
- `packages/core/images/entities/image-entity.ts`

## 推奨対応

### オプション A: エンティティ型を追加（推奨）

```typescript
// article-entity.ts に追加
export const LastUpdatedArticle = Base.extend({ status: LastUpdatedStatus });
export type LastUpdatedArticle = Readonly<z.infer<typeof LastUpdatedArticle>>;

// Union型を定義
export type Article = UnexportedArticle | LastUpdatedArticle | ExportedArticle;
```

### オプション B: ドキュメントで明示的に除外

LAST_UPDATED状態をドメイン層ではなくインフラ層の概念として位置づけ、
`docs/domain-model.md`の意図的な逸脱に追加する。

## 影響範囲

- エンティティ型定義（4ファイル）
- リポジトリインターフェース（戻り値型の更新が必要な可能性）
- クエリリポジトリ実装（マッピング関数の更新）

## 関連

- `docs/domain-model.md` - 状態遷移図
- DDDからの意図的な逸脱 001（状態遷移ルールがバッチサービスに存在）
