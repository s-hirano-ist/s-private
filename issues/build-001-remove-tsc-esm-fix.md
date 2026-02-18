# Issue: tsc-esm-fix の除去と .js 拡張子importへの統一

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Build / DX |
| **Priority** | MEDIUM |
| **Check Item** | メンテナンスされていない `tsc-esm-fix` を除去し、相対importに `.js` 拡張子を直接記述する方式に統一する |
| **Affected File** | `packages/core/**`, `packages/notification/**`, `packages/scripts/**`, `packages/storage/**`, `packages/search/**` |

## Problem Description

`tsc-esm-fix`（v3.1.2）はメンテナンスされておらず、ESMビルド時に `.js` 拡張子を付与する役割を果たしている。これを除去し、ソースコード上で `.js` 拡張子を直接記述する方式に統一する。

### 採用方針: `.js` 拡張子直接記述

TypeScriptでは「ランタイムで `.js` になるからソースコードでも `.js` で書く」のが正統派アプローチであり、以下の利点がある:

- **シンプル**: コンパイラの書き換え機能（`rewriteRelativeImportExtensions`）に非依存
- **エッジケースを完全回避**: dynamic import・CommonJS構文・subpath importsでの誤書き換えが発生しない
- **一貫性**: ランタイムのモジュール解決と完全に一致する

`packages/search` では現在 `.ts` 拡張子 + `rewriteRelativeImportExtensions` を使用しているが、これも `.js` 方式に変更する。

### 対象パッケージ

| パッケージ | 現状 | 変更量 |
|---|---|---|
| `packages/core` | `tsc-esm-fix` 使用、拡張子なしimport | 61ファイル・174箇所のimportに `.js` 追加 |
| `packages/notification` | `tsc-esm-fix` 使用、拡張子なしimport | 3ファイル・7箇所のimportに `.js` 追加 |
| `packages/scripts` | `rewriteRelativeImportExtensions: true` 設定済みだが `tsc-esm-fix` も残存（冗長） | 8箇所の拡張子なしimportに `.js` 追加 |
| `packages/storage` | `tsc-esm-fix` 使用、拡張子なしimport | 5ファイル・8箇所のimportに `.js` 追加 |
| `packages/search` | `rewriteRelativeImportExtensions: true` + `.ts` 拡張子import | 4ファイル・7箇所のimportを `.ts` → `.js` に変更 |

## Implementation Steps

### 1. `packages/notification`（最小・動作確認用）

- ソースファイルの相対importに `.js` 拡張子を追加（`from "./foo"` → `from "./foo.js"`）
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/notification/package.json`
- `packages/notification/index.ts`
- `packages/notification/pushover.ts`
- `packages/notification/pushover.test.ts`

### 2. `packages/core`（最大規模）

- 61ファイル・174箇所の相対importに `.js` 拡張子を追加
  - `from "./foo"` → `from "./foo.js"`
  - `from "../foo/bar"` → `from "../foo/bar.js"`
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/core/package.json`
- `packages/core/**/*.ts`（61ファイル）

### 3. `packages/scripts`（既に `rewriteRelativeImportExtensions` あり）

- 残存する拡張子なしimport（8箇所）に `.js` 拡張子を追加
- `tsconfig.json` から `rewriteRelativeImportExtensions: true` を削除
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/scripts/tsconfig.json`
- `packages/scripts/package.json`
- `packages/scripts/src/reset-*.ts`, `packages/scripts/src/revert-*.ts`, `packages/scripts/src/rag/ingest.ts`

### 4. `packages/storage`

- 8箇所の相対importに `.js` 拡張子を追加（`from "./foo"` → `from "./foo.js"`）
- `package.json`: build スクリプトを `"tsc"` に変更、devDependencies から `tsc-esm-fix` 削除

**対象ファイル:**
- `packages/storage/package.json`
- `packages/storage/src/index.ts`
- `packages/storage/src/client.ts`
- `packages/storage/src/cf-access-transport.ts`
- `packages/storage/src/storage-service.ts`

### 5. `packages/search`（`.ts` → `.js` 変更）

- 7箇所の相対importの拡張子を `.ts` → `.js` に変更（`from "./foo.ts"` → `from "./foo.js"`）
- `tsconfig.json` から `rewriteRelativeImportExtensions: true` を削除

**対象ファイル:**
- `packages/search/tsconfig.json`
- `packages/search/src/ingest.ts`
- `packages/search/src/embedding.ts`
- `packages/search/src/chunker.ts`
- `packages/search/src/qdrant-client.ts`

### 6. `services/embedding-api`（tsconfig修正のみ）

- `tsconfig.json` から `rewriteRelativeImportExtensions: true` を削除
  - ※ このパッケージのimportは既に `.js` 拡張子を使用しているか、拡張子が不要な形式のため、importの変更は不要

**対象ファイル:**
- `services/embedding-api/tsconfig.json`

### 7. lockfile 更新

- `pnpm install` を実行してlockfileを更新

## Verification

1. `pnpm --filter @s-hirano-ist/s-notification build` — ビルド成功を確認
2. `pnpm --filter @s-hirano-ist/s-core build` — ビルド成功を確認
3. `pnpm --filter @s-hirano-ist/s-scripts build` — ビルド成功を確認
4. `pnpm --filter @s-hirano-ist/s-storage build` — ビルド成功を確認
5. `pnpm --filter @s-hirano-ist/s-search build` — ビルド成功を確認
6. ビルド成果物（`dist/`）内のimportに `.js` 拡張子が付与されていることを確認
7. `pnpm test` — テスト通過を確認
8. `pnpm lint:fix && pnpm check:fix` — lint/format通過を確認

## 注意点・エッジケース

### `rewriteRelativeImportExtensions` を採用しない理由

> 参考: https://zenn.dev/uhyo/articles/rewrite-relative-import-extensions-read-before-use

TypeScript公式チームは `rewriteRelativeImportExtensions` の使用場面を「Node.jsの `--experimental-strip-types` を使う場合」に限定して推奨している。本プロジェクトではtscによるトランスパイルを行っているため、`.js` 拡張子直接記述の方が適切。

以下のエッジケースは `.js` 方式では発生しないが、`rewriteRelativeImportExtensions` 方式では注意が必要だった問題として参考に記録する:

#### Dynamic import

実行時に決定されるimportパス（`import(dynamicPath)`）には静的な書き換えが効かず、ランタイムに正規表現ベースの書き換え関数が埋め込まれる。

#### CommonJS構文

`import foo = require('./foo.ts')` 形式の場合、ディレクトリ解決の違いにより誤った書き換えが生じうる。

#### Subpath imports

`#` で始まるパス（package.jsonの `imports` フィールド）は機械的な書き換えが不正確になる可能性がある。

## References

- TypeScript ドキュメント: `rewriteRelativeImportExtensions` オプション
- uhyo氏の解説記事: https://zenn.dev/uhyo/articles/rewrite-relative-import-extensions-read-before-use
- 現在の `tsc-esm-fix` 使用箇所: 各パッケージの `package.json` の build スクリプト
