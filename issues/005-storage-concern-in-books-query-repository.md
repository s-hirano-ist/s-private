# Issue 005: BooksQueryRepositoryにストレージ関連メソッド混在

## 概要

| 項目 | 内容 |
|------|------|
| **重要度** | Medium |
| **DDD原則** | 単一責任の原則 / リポジトリ設計 |
| **対象ファイル** | `packages/core/books/repositories/books-query-repository.interface.ts` |

## 現状

```typescript
export interface IBooksQueryRepository {
  // クエリ操作（適切）
  findById(id: Id): Promise<Book | null>;
  findMany(userId: UserId): Promise<Book[]>;
  search(query: string, userId: UserId): Promise<Book[]>;

  // ストレージ操作（不適切）
  getImageFromStorage(path: string, isThumbnail: boolean): Promise<NodeJS.ReadableStream>;
}
```

## 問題点

1. **単一責任の原則違反**: リポジトリがデータ永続化とストレージアクセスの2つの責務を持っている
2. **非ブランド型の使用**: `path` が生の `string` 型（`Path` ブランド型ではない）
3. **インフラ固有の型**: `NodeJS.ReadableStream` はインフラ層の型であり、ドメイン層に露出すべきでない
4. **関心の分離**: 画像ストレージアクセスは `IStorageService` の責務

## 改善案

### Step 1: メソッドを削除

`getImageFromStorage` を `IBooksQueryRepository` から削除。

```typescript
export interface IBooksQueryRepository {
  findById(id: Id): Promise<Book | null>;
  findMany(userId: UserId): Promise<Book[]>;
  search(query: string, userId: UserId): Promise<Book[]>;
  // getImageFromStorage を削除
}
```

### Step 2: IStorageService経由でアクセス

既存の `IStorageService` を使用：

```typescript
// packages/core/shared-kernel/storage-service.interface.ts
export interface IStorageService {
  getObject(path: Path): Promise<ReadableStream>;
  // ...
}
```

### Step 3: 呼び出し側を修正

```typescript
// Before
const stream = await booksQueryRepository.getImageFromStorage(path, true);

// After
const stream = await storageService.getObject(path as Path);
```

## 影響範囲

- `packages/core/books/repositories/books-query-repository.interface.ts`
- このメソッドの実装クラス
- 呼び出し側のサービス・ローダー

## 実装手順

1. `IBooksQueryRepository` から `getImageFromStorage` を削除
2. 実装クラスから対応するメソッドを削除
3. 呼び出し側を `IStorageService` 経由に変更
4. `pnpm build` で確認
5. `pnpm test` で確認
