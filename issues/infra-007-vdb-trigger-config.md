# update contents → VDB trigger の設定

## 概要

コンテンツ更新時にベクトルデータベース（Qdrant）への同期トリガーを設定する。

## 背景

コンテンツが更新された際に、自動的にVDBへのembedding更新が走る仕組みが必要。

## タスク

- [ ] トリガーの発火条件を定義
- [ ] コンテンツ更新 → embedding生成 → Qdrant upsert のパイプライン構築
- [ ] エラーハンドリング・リトライ機構の実装

## 元GH Issue

- GH#2004
