# Issue: browserslist設定によるPolyfillsチャンク削減（~80KB 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | HIGH |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/package.json` |

## Problem Description

browserslist が未設定のため、Next.js がデフォルトのブラウザ互換性設定を使用し、モダンブラウザでは不要な core-js ポリフィル（Array.from, Object.assign, Promise, Map/Set, WeakMap, Symbol, Reflect, globalThis, URLSearchParams, FormData 等）が 110KB（gzip: 39KB）の独立チャンクとしてバンドルされている。

このアプリは管理者向けの非公開CMSであり、最新ブラウザのみをサポートすれば十分。

### Current Configuration

browserslist 設定なし（Next.js デフォルト）。

## Recommendation

`app/package.json` に modern browsers 向けの browserslist を追加し、不要なポリフィルを除去する。

### Suggested Fix

`app/package.json` に以下を追加:

```json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions"
  ]
}
```

## Implementation Steps

1. [ ] `app/package.json` に browserslist 設定を追加
2. [ ] `pnpm --filter s-private-app build` でビルドし、ポリフィルチャンクの削減を確認
3. [ ] 開発環境で主要ページの動作確認
