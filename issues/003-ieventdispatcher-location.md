# IEventDispatcherの配置場所を共通モジュールに移動

## 概要

`IEventDispatcher`インターフェースがArticlesドメインに定義されており、他のドメインがArticlesに依存する形になっている。共通モジュールに移動すべき。

## 現状

```typescript
// app/src/application-services/articles/add-article.deps.ts で定義
export type IEventDispatcher = { ... };

// 他ドメインから参照
import type { IEventDispatcher } from "../articles/add-article.deps";
```

- Articlesドメインに共通インターフェースが定義されている
- 他ドメイン（books, notes, images）がArticlesに依存する形になっている
- ドメイン間の独立性が損なわれている

## 改善案

共通ディレクトリを作成し、IEventDispatcherを移動する。

```
app/src/application-services/
├── common/
│   └── event-dispatcher.interface.ts  ← ここに移動
├── articles/
├── books/
├── notes/
└── images/
```

### 実装手順

1. `app/src/application-services/common/event-dispatcher.interface.ts` を作成
2. IEventDispatcherの定義を移動
3. 各ドメインのimportパスを更新
4. 元の定義を削除

## 対象ファイル

- `app/src/application-services/articles/add-article.deps.ts` - 元の定義場所
- `app/src/application-services/books/*.deps.ts` - import更新
- `app/src/application-services/notes/*.deps.ts` - import更新
- `app/src/application-services/images/*.deps.ts` - import更新

## 優先度

中

## 備考

- 動作への影響なし（型定義のみ）
- コードの整理・一貫性向上が目的
- ドメイン間の依存関係を適切に保つためのリファクタリング
