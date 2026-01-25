# DDD-007: ドメインサービスにおける不変条件検証のタイミング

## 概要

不変条件の検証（重複チェック）がエンティティ生成の外で行われており、Application Service が検証とエンティティ生成の順序を正しく呼び出す責任を負っている。

## 問題箇所

各ドメインの `*DomainService.ensureNoDuplicate()` の使用パターン

```typescript
// Application Service での使用パターン（推測）
await articlesDomainService.ensureNoDuplicate(url, userId);  // 1. 検証
const [article, event] = articleEntity.create({ ... });       // 2. 生成
await commandRepository.create(article);                      // 3. 永続化
```

## DDDの原則との乖離

- 不変条件の検証がエンティティ生成の外で行われている
- Application Service が検証とエンティティ生成の順序を正しく呼び出す責任を負っている
- 検証を忘れた場合、不正なエンティティが生成されるリスク

## 影響

- 新しい Application Service を作成する際に検証漏れが発生する可能性
- 検証とエンティティ生成が分離しているため、コードの意図が分かりにくい
- テスト時に検証ステップを忘れやすい

## 推奨対応

### 案1: 検証済みパラメータを型で表現（推奨）

```typescript
// 検証済みであることを型で表現
type ValidatedCreateArticleArgs = CreateArticleArgs & { readonly _validated: unique symbol };

// Domain Service
class ArticlesDomainService {
  async validateAndPrepare(args: CreateArticleArgs): Promise<ValidatedCreateArticleArgs> {
    await this.ensureNoDuplicate(args.url, args.userId);
    return args as ValidatedCreateArticleArgs;
  }
}

// Entity Factory
export const articleEntity = {
  create: (args: ValidatedCreateArticleArgs): ArticleWithEvent => {
    // 型システムにより、検証済みの引数のみ受け付ける
    ...
  },
};
```

### 案2: ファクトリに検証ロジックを統合

```typescript
export const articleEntity = {
  create: async (
    args: CreateArticleArgs,
    domainService: ArticlesDomainService,
  ): Promise<ArticleWithEvent> => {
    await domainService.ensureNoDuplicate(args.url, args.userId);
    // エンティティ生成
    ...
  },
};
```

注意: この案はファクトリが非同期になり、リポジトリ依存が発生するトレードオフがある。

### 案3: ドキュメントで明確化（最小対応）

Application Service のテンプレートやドキュメントで、検証ステップを必須として明記。

```typescript
/**
 * @example
 * // 必須: エンティティ作成前に重複チェックを実施
 * await domainService.ensureNoDuplicate(url, userId);
 * const [article, event] = articleEntity.create({ ... });
 */
```

## 優先度

低

## 関連ファイル

- `packages/core/articles/services/articles-domain-service.ts`
- `packages/core/articles/entities/article-entity.ts`
- `packages/core/books/services/books-domain-service.ts`
- `packages/core/notes/services/notes-domain-service.ts`
- `packages/core/images/services/images-domain-service.ts`
