# Issue: tsc-esm-fix の除去と rewriteRelativeImportExtensions への統一

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Build / DX |
| **Priority** | MEDIUM |
| **Check Item** | メンテナンスされていない `tsc-esm-fix` を除去し、TypeScript ネイティブの `rewriteRelativeImportExtensions` に統一する |
| **Affected File** | `packages/core/**`, `packages/notification/**`, `packages/scripts/**` |

## Problem Description

`tsc-esm-fix`（v3.1.2）はメンテナンスされておらず、ESMビルド時に `.js` 拡張子を付与する役割を果たしている。TypeScript 5.2+ の `rewriteRelativeImportExtensions` オプションで同等の機能がネイティブに提供されており、`packages/search` では既にこのアプローチを採用済み。全パッケージをネイティブ方式に統一し、外部依存を除去する。

### 対象パッケージ

| パッケージ | 現状 | 変更量 |
|---|---|---|
| `packages/core` | `tsc-esm-fix` 使用、拡張子なしimport | 61ファイル・174箇所のimportに `.ts` 追加 |
| `packages/notification` | `tsc-esm-fix` 使用、拡張子なしimport | 3ファイル・7箇所のimportに `.ts` 追加 |
| `packages/scripts` | `rewriteRelativeImportExtensions: true` 設定済みだが `tsc-esm-fix` も残存（冗長） | 8箇所の拡張子なしimportに `.ts` 追加 |

## Implementation Steps

### 1. `packages/notification`（最小・動作確認用）

- `tsconfig.json` に `rewriteRelativeImportExtensions: true` を追加
- ソースファイルの相対importに `.ts` 拡張子を追加（`index.ts`, `pushover.ts`, `pushover.test.ts`）
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/notification/tsconfig.json`
- `packages/notification/package.json`
- `packages/notification/index.ts`
- `packages/notification/pushover.ts`
- `packages/notification/pushover.test.ts`

### 2. `packages/core`（最大規模）

- `tsconfig.json` に `rewriteRelativeImportExtensions: true` を追加
- 61ファイル・174箇所の相対importに `.ts` 拡張子を追加
  - `from "./foo"` → `from "./foo.ts"`
  - `from "../foo/bar"` → `from "../foo/bar.ts"`
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/core/tsconfig.json`
- `packages/core/package.json`
- `packages/core/**/*.ts`（61ファイル）

### 3. `packages/scripts`（既に `rewriteRelativeImportExtensions` あり）

- 残存する拡張子なしimport（8箇所）に `.ts` 拡張子を追加
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/scripts/package.json`
- `packages/scripts/src/reset-*.ts`, `packages/scripts/src/revert-*.ts`, `packages/scripts/src/rag/ingest.ts`

### 4. lockfile 更新

- `pnpm install` を実行してlockfileを更新

## Verification

1. `pnpm --filter @s-hirano-ist/s-notification build` — ビルド成功を確認
2. `pnpm --filter @s-hirano-ist/s-core build` — ビルド成功を確認
3. `pnpm --filter @s-hirano-ist/s-scripts build` — ビルド成功を確認
4. ビルド成果物（`dist/`）内のimportに `.js` 拡張子が付与されていることを確認
5. `pnpm test` — テスト通過を確認
6. `pnpm lint:fix && pnpm check:fix` — lint/format通過を確認

## 注意点・エッジケース

> 参考: https://zenn.dev/uhyo/articles/rewrite-relative-import-extensions-read-before-use

TypeScript公式チームは、このオプションの使用場面を「Node.jsの `--experimental-strip-types` を使う場合」に限定して推奨している。本プロジェクトではtscによるトランスパイルを行っているため、従来の「ソースコードで `.js` 拡張子を書く」アプローチも代替手段として検討可能。

### Dynamic import

実行時に決定されるimportパス（`import(dynamicPath)`）には静的な書き換えが効かず、ランタイムに正規表現ベースの書き換え関数が埋め込まれる。本プロジェクトで動的importを使用している箇所がある場合は注意が必要。

### CommonJS構文

`import foo = require('./foo.ts')` 形式の場合、ディレクトリ解決の違いにより誤った書き換えが生じうる。本プロジェクトはESMのため影響は少ないが、留意点として記録。

### Subpath imports

`#` で始まるパス（package.jsonの `imports` フィールド）は機械的な書き換えが不正確になる可能性がある。

### 代替アプローチ

「ランタイムで `.js` になるからソースコードでも `.js` で書く」というメンタルモデルの方がシンプルで保守性が高いという見解もある。ただし、`packages/search` では既に `.ts` 拡張子 + `rewriteRelativeImportExtensions` を採用済みのため、統一性の観点からは現行方針を維持する判断も妥当。

## References

- 既存の採用例: `packages/search/tsconfig.json`（`rewriteRelativeImportExtensions: true`）
- TypeScript ドキュメント: `rewriteRelativeImportExtensions` オプション
- 現在の `tsc-esm-fix` 使用箇所: 各パッケージの `package.json` の build スクリプト
