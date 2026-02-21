# Issue: UIパッケージのbarrel exportからviewer-bodyを除去

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | LOW |
| **Check Item** | バンドルサイズ最適化 |
| **Affected File** | `packages/ui/index.ts` |

## Problem Description

`packages/ui/index.ts` で `viewer-body` がbarrel re-exportされている。`viewer-body` は `react-markdown` と `react-syntax-highlighter` をimportしており、barrel importを使う消費者がいた場合にこれらの重い依存がバンドルに含まれる可能性がある。

現在の全消費者はグラニュラーimport（`@s-hirano-ist/s-ui/layouts/body/viewer-body`）を使用しているため、barrel re-exportは不要。

### Current Code/Configuration

```typescript
// packages/ui/index.ts (line 55)
export * from "./layouts/body/viewer-body";
```

## Recommendation

該当行を削除する。

## Implementation Steps

1. [ ] `packages/ui/index.ts` から `export * from "./layouts/body/viewer-body";` を削除
2. [ ] barrel importを使う箇所がないことを再確認
3. [ ] ビルド確認
