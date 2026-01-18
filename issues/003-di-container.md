# 003: DIコンテナの導入

## 優先度: 中

## 概要

現在リポジトリへの直接依存があり、テスト時のモック差し替えが困難。

## 現状

```typescript
// app/src/application-services/articles/add-article.ts
import { articlesCommandRepository } from "@/infrastructures/...";
```

## 問題点

- テスト時のモック差し替えが困難
- インフラ層への直接依存（Clean Architectureの依存方向違反）
- 実装の差し替えが困難

## 対象ファイル

- `app/src/application-services/articles/add-article.ts`
- `app/src/application-services/articles/update-article.ts`
- その他のapplication-services配下のファイル

## 改善案

### 選択肢A: 関数引数でリポジトリを注入

```typescript
// 依存を引数で受け取る
export async function addArticle(
  formData: FormData,
  deps: {
    commandRepository: IArticlesCommandRepository;
    queryRepository: IArticlesQueryRepository;
  }
): Promise<ServerAction> {
  const { commandRepository, queryRepository } = deps;
  // ...
}

// 呼び出し側（Server Action）でデフォルト実装を渡す
export async function addArticleAction(formData: FormData) {
  return addArticle(formData, {
    commandRepository: articlesCommandRepository,
    queryRepository: articlesQueryRepository,
  });
}
```

### 選択肢B: DIコンテナライブラリの導入

```typescript
// tsyringe等のDIコンテナを使用
import { container } from "tsyringe";

container.register<IArticlesCommandRepository>(
  "IArticlesCommandRepository",
  { useClass: ArticlesCommandRepository }
);

// アプリケーションサービスで注入
@injectable()
export class AddArticleService {
  constructor(
    @inject("IArticlesCommandRepository")
    private commandRepository: IArticlesCommandRepository
  ) {}
}
```

## 推奨

**選択肢A**を推奨。シンプルで導入が容易。Server Actionsとの相性も良い。

## 期待される効果

- テスト時にモックリポジトリを簡単に差し替え可能
- Clean Architectureの依存方向が明確に
- インフラ実装の差し替えが容易

## 検証方法

1. 1つのアプリケーションサービスで改善案を適用
2. 単体テストを追加してモック差し替えを検証
3. `pnpm test` でテストがパスすることを確認
4. 段階的に他のサービスにも適用
