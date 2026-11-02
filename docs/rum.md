# Sentry RUM

Issue #2765 の RUM は `@sentry/nextjs` 11 の標準計測を使う。
`web-vitals` の別依存・重複 observer・poor 評価ごとの `captureMessage` は追加しない。
Vercel Speed Insights は削除し、アクセス数・流入元を集計する Vercel Analytics は継続する。

## 計測

- BrowserTracing が LCP/CLS/INP・FCP/TTFB、遷移、fetch/XHR、画像などの resource timing、
  ロングタスクを記録する。Long Animation Frames も有効化する。ブラウザ未対応の指標は送らない。
- SDK 11 の streamed span 属性 `browser.web_vital.{lcp,cls,inp}.value` を使う。
  LCP/INP は ms、CLS は単位なし。旧 `measurements.lcp` を前提にしない。
- Server Action/loader の backend 呼び出しは `app.backend` span で時間・HTTP status を記録する。
  span 名は method と API domain のみ。Action全体ではなく共通backend境界の待ち時間である。
  `fetch` の例外処理では最初に `unstable_rethrow` を呼ぶ。Cache Components のプリレンダー中断を
  API 障害の503に変換すると、一覧や件数の error fallback がプリフェッチ結果に入り得る。
  実際の通信失敗は引き続き報告し、書き込みを自動再試行しない。
- browser の trace header は SDK 既定の同一 origin に限定する。Web の error/trace を同じ
  release/environment で調査する。独立 Hono backend 内部の distributed tracing は対象外。
- upload token がなくても `withSentryConfig` で instrumentation と `/monitoring` tunnel を有効化する。
  source map upload のみ token が必要。proxy は tunnel を認証対象から除外済み。
  CSP の `connect-src 'self'` と `worker-src 'self' blob:` を利用する。
  OAuth 開始の `/api/sign-in` は通常の anchor で document navigation する。
  Next Link の RSC prefetch で外部 IdP の redirect を取得しない。

## 無料枠

2026-11-02 に実際の Subscription を確認した。Developer plan、追加支出 $0。
当期（10/3–11/2）は Errors 3,195/5,000、Spans 約65K/5M、Replays 0/50。
Logs/Application Metrics は各5GBだが、重複するログ送信は追加しない。有料プラン・trial は有効化しない。

- 本番 trace は既定100%。現状の使用量は無料枠の約1.3%で全件計測が妥当。Preview は10%。
  `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`（0–1）で変更する。Node/Edge は親の sampling 決定を継承する。
  browser の environment/release は build 時に Vercel metadata から設定し、開発時は送信しない。
- Replay は通常 session の0%、本番 error session の10%、Preview は0%。50件/月なので error 調査を優先する。
  確率 sampling は50件以内の保証ではなく、上限到達後は Sentry が受信を制限する。
- 週次または異常時に Subscription と Stats & Usage の accepted/dropped を確認する。
  span の月末予測が5Mに近づいたら sampling を下げて再ビルド・再デプロイする。

## 内容の保護

SDK 11 の `dataCollection` で user info・Cookie・HTTP header/body・URL query・DB query data・
stack frame variables を収集しない。送信前にも error request と span の query/fragment を除く。
console/UI breadcrumb は private content が混ざる可能性があるため除外する。

Replay は全文字・全入力をマスクし、全画像・動画を block、title/alt/placeholder/aria-label/href/src
属性もマスクする。network body は収集せず、追加 breadcrumb/performance frame も除外する。
DOM構造・操作は残る。Replay のページ URL 自体は記録されるため、URLに秘密値・本文を含めない。

## 閾値監視

無料プランの MCP で次を作成した。対象は `production`、1時間の p75 が poor を超えると検知し、
good 以下で回復する。Sentry側で集計し、SDK から warning を量産しない。

| 指標 | 発火 | 回復 | Monitor |
|------|------|------|---------|
| LCP | >4,000ms | ≤2,500ms | [10831059](https://s-hirano-ist-z2.sentry.io/monitors/10831059/) |
| INP | >500ms | ≤200ms | [10831068](https://s-hirano-ist-z2.sentry.io/monitors/10831068/) |
| CLS | >0.25 | ≤0.1 | [10831069](https://s-hirano-ist-z2.sentry.io/monitors/10831069/) |

[専用Alert](https://s-hirano-ist-z2.sentry.io/monitors/alerts/6277966/) は上記3件の初回・再発・regressionを
最小間隔24時間で通知する。既存と同じ issue owner（未割当時 active member）宛。
2026-11-03 に旧エラー通知 `Notify Suggested Assignees` の対象も `production` に統一した。
`vercel-production` / `vercel-preview` は Sentry–Vercel 連携が付けた旧環境名で、別のインフラ環境ではない。
現在使う `production` / `preview` を表示し、未使用の旧2環境と送信停止済みの `development` は非表示にした。
Sentryの環境は削除できないため、非表示で整理する。過去データと再表示する手段は残る。
データなしを良好と判断しない。低traffic時は単発値の影響が大きく、通知時にサンプル数も確認する。

## 確認

`pnpm check:agent` と `pnpm build` を実行する。本番形式でページ表示・遷移・操作を行い、
`/monitoring` の送信、CSP違反、Web Vitals と `app.backend`/`resource.img` の到着を確認する。
Replay は10%のため通常閲覧だけでは送信されない。隔離したテストでのみ error sampling を100%にし、
recording payload のテキスト・入力・画像の保護を確認する。実ユーザー環境に意図的な error を発生させない。
Productionデプロイ後に新release/environmentでの到着を確認し、Issueはユーザーがcloseする。

隔離したブラウザ検証（DB・ログイン不要）:

```bash
mise exec -- env NEXT_PUBLIC_SENTRY_DSN=https://public@o0.ingest.sentry.io/1 SENTRY_AUTH_TOKEN= SKIP_ENV_VALIDATION=true pnpm build
mise exec -- pnpm exec playwright test --config playwright.rum.config.ts
```

専用テストは `/ja/error` の本番bundleを使い、全Sentry送信を横取りする。
SDK の10% sampling をテスト内の乱数だけで確定させ、LCP・error・Replayのtrace ID一致、CSP違反なし、
圧縮recordingの展開後にprivate text/input/attribute/image markerが含まれないことを確認する。
通常の開発用E2Eからは除外する。テスト用DSNをbuildに含めたため、成果物をProductionへ流用しない。

参考: [SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)、
[無料プラン更新](https://www.sentry.help/en/articles/16738709-changes-to-legacy-developer-plans-september-2026)。
