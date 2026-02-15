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

## References

- 既存の採用例: `packages/search/tsconfig.json`（`rewriteRelativeImportExtensions: true`）
- TypeScript ドキュメント: `rewriteRelativeImportExtensions` オプション
- 現在の `tsc-esm-fix` 使用箇所: 各パッケージの `package.json` の build スクリプト
