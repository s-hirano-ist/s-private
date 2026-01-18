# Aggregate Rootの明示的な定義

## 概要
現在、各ドメインのエンティティファイルは `*-entity.ts` という命名だが、DDDの観点からはこれらはAggregate Rootとして機能している。

## 現状
- `packages/core/articles/entities/article-entity.ts`
- `packages/core/books/entities/books-entity.ts`
- `packages/core/notes/entities/note-entity.ts`
- `packages/core/images/entities/image-entity.ts`

## DDDの原則
- Aggregate Rootは集約の一貫性境界を定義する
- 外部からはAggregate Rootを経由してのみ集約内部にアクセス可能
- Article, Book, Note, Imageは各ドメインの唯一のAggregate Root

## 改善案
以下のいずれかを検討：
1. ファイル名の変更: `article-entity.ts` → `article-aggregate.ts`
2. ファイル内にJSDocコメントでAggregate Rootであることを明記
3. docs/domain-model.mdでの説明で十分とする（現状維持）

## 優先度
低（動作上の問題なし、ドキュメントで既に説明済み）

## 関連ドキュメント
- docs/domain-model.md の「集約（Aggregate）境界」セクション
