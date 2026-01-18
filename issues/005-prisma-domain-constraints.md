# 005: Prismaスキーマでのドメイン不変条件

## 優先度: 低

## 概要

Value Objectの制約（文字数上限等）がDB層で保証されておらず、ドメイン不変条件がDBレベルで違反される可能性がある。

## 現状

- Value Objectの制約がDB層で保証されない
- `exportedAt`がEXPORTED状態以外でもnon-NULLになりうる
- 文字数制限がPrismaスキーマに反映されていない

## 問題点

- DBに直接アクセスした場合、不正なデータが入る可能性
- ドメイン層とDB層の制約が二重管理になる
- データ整合性の保証が弱い

## 対象ファイル

- `packages/database/prisma/schema.prisma`
- `packages/core/articles/entities/article-entity.ts`（参照用）

## 改善案

### Prismaスキーマに制約を追加

```prisma
model Category {
  id        String    @id @default(uuid())
  name      String    @unique @db.VarChar(16)  // 長さ制限を追加
  articles  Article[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Article {
  id           String    @id @default(uuid())
  title        String    @db.VarChar(128)  // 長さ制限を追加
  url          String    @unique @db.VarChar(2048)  // URL長制限
  status       Status    @default(UNEXPORTED)
  exportedAt   DateTime?
  categoryId   String
  category     Category  @relation(fields: [categoryId], references: [id])
  userId       String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // 状態とexportedAtの整合性チェック（PostgreSQL）
  // @@check("exported_at_check", "status != 'EXPORTED' OR exportedAt IS NOT NULL")
}
```

### ドメイン制約とPrismaスキーマの対応表

| ドメイン制約 | Prismaスキーマ |
|-------------|---------------|
| `ArticleTitle: max(128)` | `@db.VarChar(128)` |
| `CategoryName: max(16)` | `@db.VarChar(16)` |
| `Url: max(2048)` | `@db.VarChar(2048)` |
| `status === EXPORTED → exportedAt !== null` | `@@check` (要DB対応) |

## 注意点

- `@@check`はPrismaが完全サポートしていないため、生SQLマイグレーションが必要
- 既存データのマイグレーションが必要な場合がある
- 制約追加前にデータの整合性確認が必要

## 期待される効果

- DBレベルでドメイン不変条件が保証される
- 直接DBアクセス時も不正データを防止
- データ整合性の二重保証

## 検証方法

1. Prismaスキーマを更新
2. `pnpm prisma:migrate` でマイグレーション実行
3. 既存データの整合性確認
4. `pnpm test` で既存テストがパスすることを確認
