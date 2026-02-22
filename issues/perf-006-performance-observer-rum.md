# Issue: PerformanceObserver によるReal User Monitoring（RUM）導入

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | MEDIUM |
| **Check Item** | Core Web Vitals のカスタム計測・監視 |
| **Affected File** | `app/src/app/[locale]/layout.tsx`, `app/src/instrumentation-client.ts` |

## Problem Description

Vercel Analytics（`@vercel/analytics@1.6.1`）と Speed Insights（`@vercel/speed-insights@1.3.1`）が導入済みだが、以下の課題がある:

1. Vercel Analytics はVercelダッシュボードに閉じており、Sentryのエラー監視と統合されていない
2. パフォーマンス劣化とエラー発生の相関分析ができない
3. LCP/CLS/INP等のCore Web Vitalsの閾値超過時にアラートを発する仕組みがない
4. カスタムメトリクス（Server Action実行時間、画像読み込み時間等）を計測していない

### Current Configuration

```typescript
// app/src/instrumentation-client.ts
Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.2,
  _experiments: { enableLogs: true },
});
```

Sentry のトレーシング（`tracesSampleRate: 0.2`）は有効だが、Web Vitals のカスタム計測は未実装。

## Recommendation

`web-vitals` ライブラリと `PerformanceObserver` APIを活用し、Core Web VitalsをSentryに送信する仕組みを構築する。

### Suggested Fix

#### 1. web-vitals によるCore Web Vitals計測

```typescript
// app/src/lib/web-vitals.ts
import { type Metric, onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import * as Sentry from "@sentry/nextjs";

function sendToSentry(metric: Metric) {
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: "millisecond",
    tags: {
      rating: metric.rating, // "good" | "needs-improvement" | "poor"
      navigationType: metric.navigationType,
    },
  });

  // "poor" 評価の場合はSentryにイベントとして送信
  if (metric.rating === "poor") {
    Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}`, {
      level: "warning",
      tags: { metric: metric.name, rating: metric.rating },
      extra: { entries: metric.entries },
    });
  }
}

export function initWebVitals() {
  onLCP(sendToSentry);
  onCLS(sendToSentry);
  onINP(sendToSentry);
  onFCP(sendToSentry);
  onTTFB(sendToSentry);
}
```

#### 2. instrumentation-client.ts への統合

```typescript
// app/src/instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";
import { env } from "@/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.2,
  _experiments: { enableLogs: true },
});

// Web Vitals の計測開始
if (typeof window !== "undefined") {
  import("@/lib/web-vitals").then(({ initWebVitals }) => initWebVitals());
}
```

#### 3. カスタム PerformanceObserver によるロングタスク検知

```typescript
// app/src/lib/performance-observers.ts
import * as Sentry from "@sentry/nextjs";

export function observeLongTasks() {
  if (!("PerformanceObserver" in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        Sentry.addBreadcrumb({
          category: "performance",
          message: `Long task: ${entry.duration.toFixed(0)}ms`,
          level: "warning",
          data: { duration: entry.duration, startTime: entry.startTime },
        });
      }
    }
  });

  observer.observe({ type: "longtask", buffered: true });
}
```

## Implementation Steps

1. [ ] `web-vitals` パッケージをインストール（`pnpm --filter s-private-app add web-vitals`）
2. [ ] `app/src/lib/web-vitals.ts` を作成しCore Web Vitals計測ロジックを実装
3. [ ] `app/src/lib/performance-observers.ts` を作成しロングタスク検知を実装
4. [ ] `app/src/instrumentation-client.ts` に統合
5. [ ] Sentry ダッシュボードでWeb Vitalsメトリクスの表示を確認
6. [ ] Poor評価時のアラートルールをSentryに設定
