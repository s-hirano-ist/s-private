# DDD-003: Query Repository 戻り値パターンの不整合

## 優先度
**Medium**

## 概要
Query Repository の戻り値パターンがドメイン間で統一されておらず、新規ドメイン追加時に混乱を招く可能性がある。

## 現状の比較

| ドメイン | findMany | findByXxx（単一取得） | search |
|---------|----------|----------------------|--------|
| Articles | `ArticleListItemDTO[]` | `UnexportedArticle \| ExportedArticle \| null` | `ArticleListItemDTO[]` |
| Notes | `NoteListItemDTO[]` | `UnexportedNote \| ExportedNote \| null` | `NoteSearchItemDTO[]` |
| Books | `BookListItemDTO[]` | `UnexportedBook \| ExportedBook \| null` | `BookSearchItemDTO[]` |

### パターンの差異

1. **findMany**: 全ドメインで DTO 返却（一貫性あり）
2. **findByXxx**: 全ドメインで Entity 返却（一貫性あり）
3. **search**: Articles のみ ListItemDTO、他は SearchItemDTO（不整合）

## 詳細

### Articles Query Repository
**`packages/core/articles/repositories/articles-query-repository.interface.ts`**

```typescript
// リスト取得 → DTO
findMany(
  userId: UserId,
  status: Status,
  params: ArticlesFindManyParams,
): Promise<ArticleListItemDTO[]>;

// 単一取得 → Entity
findByUrl(
  url: Url,
  userId: UserId,
): Promise<UnexportedArticle | ExportedArticle | null>;

// 検索 → ListItemDTO（他と異なる）
search(
  query: string,
  userId: UserId,
  limit?: number,
): Promise<ArticleListItemDTO[]>;
```

### Notes Query Repository
**`packages/core/notes/repositories/notes-query-repository.interface.ts`**

```typescript
// 検索 → SearchItemDTO
search(
  query: string,
  userId: UserId,
  limit?: number,
): Promise<NoteSearchItemDTO[]>;
```

### Books Query Repository
**`packages/core/books/repositories/books-query-repository.interface.ts`**

```typescript
// 検索 → SearchItemDTO
search(
  query: string,
  userId: UserId,
  limit?: number,
): Promise<BookSearchItemDTO[]>;
```

## 推奨パターン

### オプション A: 用途別パターン（推奨）

| メソッド | 戻り値 | 理由 |
|---------|--------|------|
| findMany | `ListItemDTO[]` | 一覧表示用に最適化されたフィールドのみ |
| findByXxx | `Entity \| null` | ドメインロジック実行用にフルエンティティ |
| search | `SearchItemDTO[]` | 検索結果表示用にスコア等を含む |

### オプション B: 全DTO パターン

| メソッド | 戻り値 | 理由 |
|---------|--------|------|
| findMany | `ListItemDTO[]` | クエリ側は常に DTO |
| findByXxx | `DetailDTO \| null` | クエリ側は常に DTO |
| search | `SearchItemDTO[]` | クエリ側は常に DTO |

## 修正内容（オプション A を採用する場合）

### Articles の search メソッドを修正

1. `ArticleSearchItemDTO` 型を新規定義
2. `search` の戻り値を `ArticleSearchItemDTO[]` に変更
3. 実装側も合わせて修正

**`packages/core/articles/entities/article-entity.ts`**

```typescript
// 追加
export type ArticleSearchItemDTO = ArticleListItemDTO & {
  // 検索固有のフィールド（必要に応じて）
  matchedField?: string;
  relevanceScore?: number;
};
```

## 影響範囲
- `packages/core/articles/entities/article-entity.ts` - DTO 追加
- `packages/core/articles/repositories/articles-query-repository.interface.ts` - 戻り値変更
- `app/src/infrastructures/articles/repositories/articles-query-repository.ts` - 実装修正
- 検索機能を使用している UI コンポーネント

## 推奨事項

1. **ガイドライン整備**: `docs/domain-model.md` に Query Repository の戻り値パターンを明記
2. **新規ドメイン追加時**: 既存パターンに従うよう注意喚起
3. **既存コード修正**: 優先度は低いが、リファクタリング機会があれば統一

## ガイドライン案

```markdown
## Query Repository 戻り値規約

### 基本原則
- **リスト取得（findMany）**: `ListItemDTO[]` を返す
  - 一覧表示に必要なフィールドのみ含める
  - パフォーマンス最適化のため、関連エンティティは展開しない

- **単一取得（findByXxx）**: `Entity | null` を返す
  - 重複チェック等のドメインロジックに使用
  - イミュータブル（Object.freeze）で返す

- **検索（search）**: `SearchItemDTO[]` を返す
  - 検索固有のメタデータ（マッチ位置等）を含められる
  - ListItemDTO の拡張として定義
```

## 関連ドキュメント
- `docs/domain-model.md` - ドメインモデル設計
- `docs/architecture.md` - CQRS パターンの説明
