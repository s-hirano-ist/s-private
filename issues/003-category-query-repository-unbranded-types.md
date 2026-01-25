# Issue 003: CategoryQueryRepositoryが非ブランド型を返す

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Low |
| **DDD原則** | 値オブジェクト / 型安全性 |
| **対象ファイル** | `packages/core/articles/repositories/category-query-repository.interface.ts` |

## 現状

```typescript
export interface ICategoryQueryRepository {
  findMany(input: { userId: string }): Promise<{ id: string; name: string }[]>;
}
```

戻り値が生の `string` 型であり、ブランド型（`Id`, `CategoryName`）を使用していません。

## 問題点

- 型安全性が低下する
- 他のドメインの `string` 型と混同する可能性がある
- ブランド型による型チェックの恩恵を受けられない

## 改善案

DTO型を定義し、ブランド型を使用：

```typescript
import { Id } from "@/shared-kernel/id";
import { CategoryName } from "../value-objects/category-name";

export type CategoryListItemDTO = Readonly<{
  id: Id;
  name: CategoryName;
}>;

export interface ICategoryQueryRepository {
  findMany(input: { userId: UserId }): Promise<CategoryListItemDTO[]>;
}
```

## 影響範囲

- `packages/core/articles/repositories/category-query-repository.interface.ts`
- このリポジトリの実装クラス
- リポジトリを使用するサービス・ローダー

## 実装手順

1. `CategoryListItemDTO` 型を定義
2. `ICategoryQueryRepository` の戻り値型を更新
3. 実装クラスを更新
4. 呼び出し側を確認・更新
5. `pnpm build` で型エラーがないことを確認
