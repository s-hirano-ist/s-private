# Issue: Sentry bundleSizeOptimizations によるクライアントバンドル削減（~3-5KB gzip削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | MEDIUM |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/next.config.mjs` |

## Problem Description

`app/next.config.mjs` の `withSentryConfig` に `bundleSizeOptimizations` が未設定のため、Sentry SDKのデバッグ文がクライアントバンドルに含まれたままになっている。

`app/instrumentation-client.ts` で `captureRouterTransitionStart` と `tracesSampleRate: 0.2` を使用しているため、トレーシング機能は維持する必要がある。

### Current Configuration

```javascript
// app/next.config.mjs
withSentryConfig(nextConfig, {
  org: "s-hirano-ist-z2",
  project: "s-private-sentry",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // bundleSizeOptimizations が未設定
})
```

## Recommendation

`withSentryConfig` の第2引数に `bundleSizeOptimizations` を追加し、不要なデバッグ文を除去する。

### Suggested Fix

```javascript
withSentryConfig(nextConfig, {
  // ...既存の設定
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
})
```

**注意:** `excludeTracing: true` は設定しないこと。`instrumentation-client.ts` でクライアントトレーシング（`captureRouterTransitionStart`, `tracesSampleRate: 0.2`）を使用中。

## Implementation Steps

1. [ ] `app/next.config.mjs` の `withSentryConfig` に `bundleSizeOptimizations` を追加
2. [ ] `pnpm --filter s-private-app build` でビルドし、Sentry関連チャンクの削減を確認
3. [ ] 開発環境でエラーハンドリング（error.tsx, global-error.tsx）の動作確認
