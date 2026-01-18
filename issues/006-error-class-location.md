# エラークラスの定義場所統一

## 概要

ドメインエラー（DuplicateError等）が複数の場所に定義されており、統一が必要。

## 現状

エラークラスが以下の2箇所に分散している:

1. `app/src/common/error/error-classes.ts` - アプリケーション層
2. `packages/core/errors/` - ドメイン層

### 問題点

- どこにどのエラーを定義すべきか不明確
- ドメインエラーがアプリケーション層に混在
- インポートパスの一貫性がない

## 改善案

### 分類基準

1. **ドメインエラー** → `packages/core/errors/`
   - ビジネスルール違反
   - エンティティの状態異常
   - 例: `DuplicateError`, `NotFoundError`, `InvalidStateError`

2. **インフラエラー** → `app/src/infrastructures/errors/`
   - DB接続エラー
   - 外部API通信エラー
   - 例: `DatabaseConnectionError`, `StorageError`

3. **アプリケーションエラー** → `app/src/common/error/`
   - 認証・認可エラー
   - バリデーションエラー（Zod以外）
   - 例: `AuthenticationError`, `AuthorizationError`

### 実装手順

1. エラークラスの分類を行う
2. `packages/core/errors/`に不足しているドメインエラーを移動
3. インポートパスを更新
4. `app/src/common/error/`から移動したエラーを削除

## 対象ファイル

- `packages/core/errors/` - ドメインエラー
- `app/src/common/error/error-classes.ts` - 現在の混在ファイル
- エラーをインポートしている各ファイル

## 優先度

低

## 備考

- 動作への影響なし
- 新規エラー追加時の判断基準として有用
- ドキュメント（docs/architecture.md）にも分類基準を追記推奨
