# batch export 時の cache revalidate が効かない問題の修正

## 概要

batch export実行時にキャッシュのrevalidateが正しく動作しない問題を修正する。

## 症状

batch exportを実行しても、キャッシュが更新されず古いデータが表示され続ける。

## タスク

- [ ] revalidateが効かない原因を調査
- [ ] キャッシュ戦略の見直し・修正
- [ ] 修正後の動作確認

## 元GH Issue

- GH#1924
