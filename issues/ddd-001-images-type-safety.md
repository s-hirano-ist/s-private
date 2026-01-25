# DDD-001: Images ドメインの型安全性欠如

## 優先度
**Critical**

## 概要
Images ドメインの `IImagesCommandRepository.deleteById` メソッドが、他のドメイン（Articles, Notes, Books）で使用されているブランデッド型（`Id`, `UserId`）ではなく、プリミティブな `string` 型を使用している。

## 問題点
コンパイル時の型安全性が失われており、誤って他の文字列（例: path や title）を id として渡してもコンパイルエラーにならない。

### 現状のコード

**`packages/core/images/repositories/images-command-repository.interface.ts:47-51`**
```typescript
deleteById(
  id: string,       // プリミティブ型
  userId: string,   // プリミティブ型
  status: Status,
): Promise<DeleteImageResult>;
```

**`app/src/infrastructures/images/repositories/images-command-repository.ts:23-26`**
```typescript
async function deleteById(
  id: string,       // プリミティブ型
  userId: string,   // プリミティブ型
  status: Status,
): Promise<DeleteImageResult> {
```

### 他のドメインとの比較

**`app/src/infrastructures/articles/repositories/articles-command-repository.ts:53-56`**
```typescript
async function deleteById(
  id: Id,           // ブランデッド型
  userId: UserId,   // ブランデッド型
  status: Status,
): Promise<DeleteArticleResult> {
```

## 修正内容

### 1. インターフェースの修正
**ファイル**: `packages/core/images/repositories/images-command-repository.interface.ts`

```typescript
// Before
import type { Status } from "../../shared-kernel/entities/common-entity.js";

deleteById(
  id: string,
  userId: string,
  status: Status,
): Promise<DeleteImageResult>;

// After
import type {
  Id,
  Status,
  UserId,
} from "../../shared-kernel/entities/common-entity.js";

deleteById(
  id: Id,
  userId: UserId,
  status: Status,
): Promise<DeleteImageResult>;
```

### 2. 実装の修正
**ファイル**: `app/src/infrastructures/images/repositories/images-command-repository.ts`

```typescript
// Before
import type { Status } from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

async function deleteById(
  id: string,
  userId: string,
  status: Status,
): Promise<DeleteImageResult> {

// After
import type {
  Id,
  Status,
  UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";

async function deleteById(
  id: Id,
  userId: UserId,
  status: Status,
): Promise<DeleteImageResult> {
```

## 影響範囲
- `packages/core/images/repositories/images-command-repository.interface.ts`
- `app/src/infrastructures/images/repositories/images-command-repository.ts`
- `deleteById` を呼び出している箇所（Application Service 等）

## 検証方法
```bash
# 型チェック
pnpm build

# テスト実行
pnpm test
```

## 関連ドキュメント
- `docs/domain-model.md` - ドメインモデル設計
- `packages/core/shared-kernel/entities/common-entity.ts` - ブランデッド型定義
