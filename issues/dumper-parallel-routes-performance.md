# (dumper) Parallel Routesのパフォーマンス問題

## 概要
`app/src/app/[locale]/(dumper)/` のParallel Routes構造がNext.js v16のパフォーマンス最適化に適していない。

## 問題点
1. 全4つのParallel Routeが毎リクエストで実行される（3つは`null`を返すだけ）
2. `searchParams`がDynamic Renderingを強制し、Cache Componentsの恩恵が限定的
3. サーバーとクライアントで二重のタブ表示制御（冗長）
4. `default.tsx`での`notFound()`がタブ切り替えで不適切

## 影響ファイル
- `app/src/app/[locale]/(dumper)/layout.tsx`
- `app/src/app/[locale]/(dumper)/@articles/page.tsx`
- `app/src/app/[locale]/(dumper)/@notes/page.tsx`
- `app/src/app/[locale]/(dumper)/@books/page.tsx`
- `app/src/app/[locale]/(dumper)/@images/page.tsx`
- `app/src/components/common/layouts/nav/root-tab.tsx`

## 推奨対応
### オプションA（最小変更）
- page.tsxから`searchParams`条件チェックを削除
- `default.tsx`を`return null`に変更
- クライアントサイドのみでタブ表示を制御

### オプションB（推奨・大規模変更）
- Parallel Routesを廃止し、単一page.tsxに統合
- `searchParams.tab`を1回だけ読み、アクティブタブのみレンダリング

## 優先度
Medium - 機能的には動作するが、サーバーリソースの無駄が発生

## ラベル
- performance
- nextjs-v16
- refactoring
