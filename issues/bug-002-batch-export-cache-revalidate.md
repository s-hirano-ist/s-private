# batch export 時の cache が updateTag で無効化されない問題の修正

## 概要

batch export実行時にキャッシュの無効化（Next.js 16 Cache Componentsの`updateTag`）が正しく動作しない問題を修正する。

## 症状

batch exportを実行しても、キャッシュが更新されず古いデータが表示され続ける。

## タスク

- [ ] command repository（`app/src/infrastructures/*/repositories/*-command-repository.ts`）での`updateTag`によるキャッシュ無効化が効かない原因を調査
- [ ] キャッシュ戦略の見直し・修正（`get-*`ローダーの`cacheTag`/`"use cache"`と`updateTag`の対応関係を確認）
- [ ] 修正後の動作確認

## 備考

- 課題管理はローカルの `issues/` ディレクトリで行う方針（GitHub Issuesではない）。
