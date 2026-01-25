# Issue 002: Categoryエンティティのアイデンティティ保護不足

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Medium |
| **DDD原則** | エンティティ/値オブジェクト区別 |
| **対象ファイル** | `packages/core/articles/services/category-service.ts` |

## 現状

CategoryはIDを持つエンティティとして設計されていますが、以下の点でDDDのエンティティパターンに従っていません：

1. **ファクトリパターンがない**: `categoryEntity.create()` のような生成メソッドがない
2. **ドメインイベントがない**: `CategoryCreatedEvent` が存在しない
3. **リポジトリが非ブランド型を返す**: `{ id: string }` を返している（ブランド型ではない）

```typescript
// 現状：サービス層で直接生成している
class CategoryService {
  async create(name: string): Promise<{ id: string }> {
    // ファクトリを使わず直接永続化
  }
}
```

## 問題点

- エンティティとしてのアイデンティティが保護されていない
- 生成ルールがドメイン層に集約されていない
- ライフサイクルイベントが追跡できない

## 改善案

### Option A: 完全なエンティティに昇格

```typescript
// packages/core/articles/entities/category-entity.ts
export const categoryEntity = {
  create: (input: { name: CategoryName; userId: UserId }): Category => {
    const id = generateId() as CategoryId;
    return { id, name: input.name, userId: input.userId };
  },
};

// packages/core/articles/events/category-created-event.ts
export class CategoryCreatedEvent extends DomainEvent<CategoryCreatedPayload> {
  constructor(data: { id: string; name: string; userId: string }, caller: Caller) {
    super("category.created", data, caller);
  }
}
```

### Option B: 値オブジェクトに降格

CategoryをIDなしの値オブジェクトとして扱い、Articleに直接埋め込む（非正規化）。

```typescript
// Article内にカテゴリ名を直接保持
const Article = z.object({
  categoryName: CategoryName.nullable(),  // Categoryエンティティではなく名前のみ
});
```

## 推奨

**Option A（エンティティに昇格）** を推奨。既にIDを持つ設計であり、カテゴリの再利用性を維持できる。

## 影響範囲

- `packages/core/articles/entities/` に `category-entity.ts` 追加
- `packages/core/articles/events/` に `category-created-event.ts` 追加
- `CategoryService` のリファクタリング
- リポジトリの戻り値型の修正

## 実装手順

1. `CategoryId` ブランド型を追加
2. `categoryEntity.create()` ファクトリを実装
3. `CategoryCreatedEvent` を追加
4. `CategoryService` をリファクタリング
5. リポジトリの戻り値型を修正
6. テスト追加・更新
