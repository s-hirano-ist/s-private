# Issue: Sentryクライアントバンドルの最適化（~100KB+ 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | HIGH |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `app/instrumentation-client.ts`, `app/src/instrumentation-client.ts`, `app/sentry.server.config.ts`, `app/sentry.edge.config.ts` |

## Problem Description

Sentryのクライアント設定で `replayIntegration()`（~100KB）が全ページで静的ロードされており、クライアントバンドルの大きな割合を占めている。さらに以下の問題がある。

### Issues

1. `replayIntegration()` が約100KBのクライアントバンドルを追加（全ページ）
2. `captureConsoleIntegration()` が不要なオーバーヘッドを追加
3. `tracesSampleRate: 1`（100%サンプリング）が本番環境で過剰
4. `app/src/instrumentation-client.ts` に重複ファイルが存在し、ハードコードされたDSNを含む（セキュリティ上の問題）

### Current Code/Configuration

```typescript
// app/instrumentation-client.ts
integrations: [replayIntegration(), captureConsoleIntegration()],
tracesSampleRate: 1,
replaysSessionSampleRate: 0.1,
replaysOnErrorSampleRate: 1,
```

## Recommendation

### 1. `replayIntegration()` と `captureConsoleIntegration()` を削除

```typescript
// app/instrumentation-client.ts
import {
	captureRouterTransitionStart,
	init,
} from "@sentry/nextjs";
import { env } from "@/env";

export const onRouterTransitionStart = captureRouterTransitionStart;

init({
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	integrations: [],
	tracesSampleRate: 0.2,
	debug: false,
});
```

Session Replayが必要な場合は `lazyLoadIntegration` で遅延読み込みを検討。

### 2. `tracesSampleRate` を `0.2` に削減

全Sentry設定ファイル（server, edge含む）で `tracesSampleRate` を `1` → `0.2` に変更。

### 3. 重複ファイル `app/src/instrumentation-client.ts` を削除

Next.jsはルートレベルの `app/instrumentation-client.ts` を使用し、`src/` 配下は無視される。ハードコードされたDSNが含まれるため、削除すべき。

## Implementation Steps

1. [ ] `app/src/instrumentation-client.ts` を削除
2. [ ] `app/instrumentation-client.ts` から `replayIntegration` と `captureConsoleIntegration` を削除
3. [ ] `app/instrumentation-client.ts` の `tracesSampleRate` を `0.2` に変更
4. [ ] `app/sentry.server.config.ts` の `tracesSampleRate` を `0.2` に変更
5. [ ] `app/sentry.edge.config.ts` の `tracesSampleRate` を `0.2` に変更
6. [ ] ビルド・動作確認

## References

- [Sentry Lazy Loading Integrations](https://docs.sentry.io/platforms/javascript/configuration/integrations/#lazy-loading-integrations)
- [Sentry Performance Sampling](https://docs.sentry.io/platforms/javascript/configuration/sampling/)
