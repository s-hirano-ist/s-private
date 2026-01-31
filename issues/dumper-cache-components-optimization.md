# (dumper) Cache Components最適化

## 概要
Next.js v16のCache Components機能を(dumper)セクションで最大限活用するための最適化。

## 現状
- `cacheComponents: true`は有効
- データフェッチ関数には`"use cache"`が適用済み
- しかしルーティング層で動的レンダリングが強制されている

## 推奨対応
1. `searchParams`への依存を最小化
2. データフェッチ関数の`cacheLife`設定を見直し
3. `staleTimes`設定の最適化検証

## 関連ファイル
- `app/next.config.mjs` (staleTimes設定)
- `app/src/application-services/*/get-*.ts` (use cache適用済み)
- `app/src/loaders/*/` (データローダー)

## 優先度
Low - 現状でもキャッシュは機能している

## ラベル
- performance
- nextjs-v16
- caching
