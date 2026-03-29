# pnpm 11 サプライチェーンセキュリティ機能の導入

## 概要

pnpm 11 で導入されるサプライチェーンセキュリティ機能を、stable リリース後に導入する。

参考: https://creators.bengo4.com/entry/2026/01/26/080000

## 対象機能

### `allowBuilds`（`onlyBuiltDependencies` の後継）

現在の `onlyBuiltDependencies`（許可リスト）を置き換え。パッケージ名をキー、真偽値を値とするマップ形式で、明示的な deny（`false`）も設定可能。

```yaml
allowBuilds:
  esbuild: true
  core-js: false
```

### `strictDepBuilds: true`（pnpm 11 デフォルト有効）

`allowBuilds` に未登録のパッケージがライフサイクルスクリプトを持つ場合、インストールをハードエラーにする。pnpm 10 では警告のみだが、pnpm 11 ではデフォルトでエラー。

### `trustPolicy: no-downgrade`

パッケージの信頼レベル（provenance / trusted publisher 等）が以前より低下した場合にインストールをブロック。パッケージ乗っ取り攻撃への対策。pnpm 自身のリポジトリでも使用されている。

例外が必要な場合は `trustPolicyExclude` で個別に指定:
```yaml
trustPolicyExclude:
  - package@version
```

### `blockExoticSubdeps: true`（pnpm 11 デフォルト有効）

推移的依存が npm レジストリ以外のソース（Git URL、tarball URL）から取得されることをブロック。直接依存は対象外。

## 前提条件

- pnpm 11 の stable リリース（現在 11.0.0-beta.3）
- Node.js 22+ が必要（pnpm 11 は v18-21 サポート終了）

## 主な破壊的変更（移行時の注意）

- `.npmrc` の非認証系設定は `pnpm-workspace.yaml` へ移行が必要
- `onlyBuiltDependencies` / `ignoredBuiltDependencies` / `neverBuiltDependencies` は廃止 → `allowBuilds` に統合
- lockfile フォーマット変更（自動マイグレーション）
- Store v11 への更新（`node_modules` 再インストール）
- `pnpm server` コマンド削除
- Pure ESM パッケージ化
- Dockerfile の pnpm インストール方法を corepack に変更推奨

## 対応ファイル

- `package.json`（packageManager）
- `.mise.toml`（pnpm バージョン）
- `pnpm-workspace.yaml`（セキュリティ設定）
- `.npmrc`（設定移行）
- `SECURITY.md`（ドキュメント更新）
