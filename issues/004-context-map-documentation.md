# Issue 004: Context Mapドキュメント化

## 重要度: 低

## 概要

Context Mapがドキュメント化されていない。ドメイン間の関係パターン（Partnership, Customer-Supplier, Conformist等）が明示されていない。

## 現状

- 4ドメイン（Articles, Books, Notes, Images）の独立性は確保
- Shared-Kernelの存在は明確
- ドメイン間の関係パターンが未文書化

## 対象ファイル

- `docs/domain-model.md`（追記先）

## 問題点

1. **チーム間連携の不明確さ**: ドメイン間の依存関係がコードからしか読み取れない
2. **設計意図の不明確さ**: なぜ各ドメインが独立しているのかの理由が文書化されていない
3. **新規参画者への障壁**: システム全体像の理解に時間がかかる

## 改善候補

`docs/domain-model.md` に以下のセクションを追加：

```markdown
## Context Map

### ドメイン概要

| Bounded Context | 説明 | 責務 |
|----------------|------|------|
| Articles | 記事管理 | URLからの記事収集、OGメタデータ取得、カテゴリ分類 |
| Books | 書籍管理 | Google Books連携、読書記録 |
| Notes | ノート管理 | Markdownノート作成・編集 |
| Images | 画像管理 | 画像アップロード、MinIOストレージ連携 |
| Shared-Kernel | 共有カーネル | 共通Value Objects、ユーティリティ |

### ドメイン間関係

```
┌─────────────────────────────────────────────────────┐
│                   Shared-Kernel                      │
│  (Id, Timestamp, Pagination, etc.)                  │
└─────────────────────────────────────────────────────┘
         ▲           ▲           ▲           ▲
         │           │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
    │Articles │ │  Books  │ │  Notes  │ │ Images  │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘
    (独立)      (独立)      (独立)      (独立)
```

### 関係パターン

| Source Context | Target Context | Relationship | 説明 |
|---------------|----------------|--------------|------|
| All Domains | Shared-Kernel | Shared Kernel | 共通のValue Objectsを共有 |
| Articles | Category | Same Aggregate | Categoryは記事の一部として管理 |

### 独立性の原則

- **相互非依存**: Articles, Books, Notes, Imagesは相互に依存しない
- **Shared-Kernelのみ参照**: 各ドメインはShared-Kernelの共通Value Objectsのみ参照可能
- **Cross-domain import禁止**: ESLint + dependency-cruiserで強制

### 外部システム連携

| External System | Domain | Integration Pattern |
|----------------|--------|---------------------|
| OG Metadata Service | Articles | ACL (Anti-Corruption Layer) |
| Google Books API | Books | ACL via `IGitHubBookFetcher` |
| MinIO | Images | Infrastructure Adapter |
| Auth0 | All | Separate Context |
```

## 実装方針

1. `docs/domain-model.md` にContext Mapセクションを追加
2. 各ドメインの責務を明記
3. 外部システム連携パターンを文書化

## 参考

- Eric Evans: Domain-Driven Design, Chapter 14 - Context Mapping
- [Context Mapping Pattern](https://www.infoq.com/articles/ddd-contextmapping/)
