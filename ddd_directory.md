# DDD観点からのディレクトリ構成レビュー結果

## 良い点 ✅

### 1. レイヤードアーキテクチャの明確な分離
- `domains/` - ドメイン層
- `infrastructures/` - インフラストラクチャ層 
- `features/` - アプリケーション層
- `app/` - プレゼンテーション層

### 2. 依存関係の方向性が適切
- インフラ層がドメイン層のインターフェースを実装
- ドメイン層は外部依存を持たない

### 3. Repository パターンの適切な実装
- Query/Command の分離（CQRS）
- インターフェース定義がドメイン層に存在

## 改善が必要な箇所 ⚠️

### 1. エンティティがデータ構造に近い
**現状**: `domains/*/entities/` 内のファイルがZodスキーマ定義のみ
**問題**: ビジネスロジックを持つ真のエンティティクラスが不在
**推奨**: エンティティクラスを作成し、振る舞いをカプセル化

```typescript
// 現状: src/domains/books/entities/books-entity.ts
export const booksInputSchema = z.object({...});

// 推奨: 
export class BookEntity {
  constructor(private props: BookProps) {}
  
  public validateISBN(): boolean { /* ビジネスロジック */ }
  public canBeExported(): boolean { /* ビジネスロジック */ }
}
```

### 2. Value Objectの不在
**現状**: ISBN、URLなどがZodスキーマ内に混在
**問題**: ドメインの重要な概念が型安全性と振る舞いを持たない
**推奨**: Value Objectとして独立させる

```typescript
// 推奨:
export class ISBN {
  constructor(private value: string) {
    this.validate();
  }
  
  private validate(): void { /* バリデーションロジック */ }
  public toString(): string { return this.value; }
}
```

### 3. ドメインサービスの責務が不明瞭
**現状**: FormDataの処理などプレゼンテーション層の関心事が混入
**問題**: ドメインサービスがWeb固有の処理を担当
**推奨**: 純粋なドメインロジックに集中

```typescript
// 現状: src/domains/books/services/books-domain-service.ts
public async prepareNewBook(formData: FormData, userId: string)

// 推奨:
public async validateDuplicateBook(isbn: ISBN, userId: UserId): Promise<void>
```

### 4. features層の位置づけが曖昧
**現状**: アプリケーションサービスとしてUIコンポーネントも含む
**問題**: 責務の分離が不十分
**推奨**: `application/` 層を別途作成し、UIと分離

```
src/
├── application/        # 新規作成
│   ├── books/
│   │   ├── use-cases/
│   │   └── dto/
├── features/           # UIコンポーネントのみ
│   ├── books/
│   │   └── components/
```

### 5. 集約の境界が不明確
**現状**: News-Category間の関係が適切に集約として定義されていない
**問題**: トランザクション境界の管理が不明瞭
**推奨**: 集約ルートの明確化

```typescript
// 推奨:
export class NewsAggregate {
  constructor(
    private news: NewsEntity,
    private category: CategoryEntity
  ) {}
  
  public changeCategory(newCategory: CategoryEntity): void {
    // 集約内での整合性保証
  }
}
```

## 推奨改善案

### 短期的改善（優先度: 高）
1. **真のエンティティクラス作成**
   - Zodスキーマから独立したエンティティクラス
   - ビジネスロジックのカプセル化

2. **Value Objectの導入**
   - ISBN、URL、Titleなどの重要概念
   - 不変性とバリデーションの保証

### 中期的改善（優先度: 中）
3. **アプリケーション層の明確な分離**
   - Use Caseパターンの導入
   - DTOによる層間データ転送

4. **ドメインサービスのリファクタリング**
   - Web固有処理の除去
   - 純粋なドメインロジックへの集中

### 長期的改善（優先度: 低）
5. **ドメインイベントの導入検討**
   - 集約間の疎結合
   - 副作用の管理

6. **集約ルートの明確化**
   - トランザクション境界の定義
   - 整合性制約の管理

## 参考資料
- エリック・エヴァンス「ドメイン駆動設計」
- ヴォーン・ヴァーノン「実践ドメイン駆動設計」
- Clean Architecture by Robert C. Martin