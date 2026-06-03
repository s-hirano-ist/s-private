# 画像ビューワー高度化

## 概要

画像ビューワーの機能を大幅に強化する。

## 技術候補

- react-photo-album: https://react-photo-album.com/examples/nextjs

## 機能要件

- [ ] 無限スクロール
- [ ] ソート機能（sortable）
- [x] next/image 対応（実装済み。ただし `unoptimized` で描画中のため最適化は下記参照）
- [ ] 画像選択機能（selectable）
- [x] 画像削除機能（deletable）（実装済み。バッチ削除には selectable が必要）
- [ ] 画像最適化（Vercel or Cloudflare optimize）
- [ ] images dump tag 機能

## 元GH Issue

- GH#1284
