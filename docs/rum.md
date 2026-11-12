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
  release/environment で調査する。独立 Hono backend は isolation scope と受信 HTTP span を作り、Web が生成した trace context を引き継ぐ。
  backend の span は route template と許可した HTTP 属性だけを残す。
- upload token がなくても `withSentryConfig` で instrumentation と `/monitoring` tunnel を有効化する。
  source map upload のみ token が必要。proxy は tunnel を認証対象から除外済み。
  CSP の `connect-src 'self'` と `worker-src 'self' blob:` を利用する。
  OAuth 開始の `/api/sign-in` は通常の anchor で document navigation する。
  Next Link の RSC prefetch で外部 IdP の redirect を取得しない。

## 無料枠

2026-11-02 に実際の Subscription を確認した。Developer plan、追加支出 $0。
当期（10/3–11/2）は Errors 3,195/5,000、Spans 約65K/5M、Replays 0/50。
Logs/Application Metrics は各5GB。固定メッセージの運用ログと低cardinalityの独自Metricsを送る。
有料プラン・trial は有効化しない。

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
mise exec -- env NEXT_PUBLIC_SENTRY_DSN=https://public@o0.ingest.sentry.io/1 SENTRY_AUTH_TOKEN= SENTRY_REPORT_URL=https://csp.invalid/report SKIP_ENV_VALIDATION=true pnpm build
mise exec -- pnpm exec playwright test --config playwright.rum.config.ts
```

専用テストは `/ja/error` の本番bundleを使い、全Sentry送信を横取りする。
SDK の10% sampling をテスト内の乱数だけで確定させ、LCP・error・Replayのtrace ID一致、CSP違反なし、
圧縮recordingの展開後にprivate text/input/attribute/image markerが含まれないことを確認する。
通常の開発用E2Eからは除外する。テスト用DSNをbuildに含めたため、成果物をProductionへ流用しない。

テーマ切替時の固定CSS許可と、未知のCSSの拒否も同じproduction E2Eで確認する。
意図的なCSP違反の報告先はテスト専用の無効なhostとし、実Sentryには送らない。
操作補助付きブラウザ自身がCSSを注入する場合の切り分けは
[Inline style CSP の調査](csp-investigation.md) を参照する。

参考: [SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)、
[無料プラン更新](https://www.sentry.help/en/articles/16738709-changes-to-legacy-developer-plans-september-2026)。

## Logs・Application Metrics・Feedback

SDK 11 は `enableLogs` / `enableMetrics` を使わず、API呼び出しで送信する。
既存Pinoの標準出力は維持し、console / Pino integrationによる全件転送は行わない。
`ServerLogger` は固定メッセージ `Application operation` とstatusだけを追加送信する。
backendのHTTP 5xxは固定の失敗ログ、CLIは開始・完了・失敗・継続可能な個別失敗を記録する。
CLIのLifecycle記録と既存のError Monitoring / Pushoverを使い分け、同一ログの二重転送を避ける。

| Metric | 種別・単位 | 属性 |
|--------|-----------|------|
| `backend.http.requests` | counter | method・route template・status |
| `backend.http.duration` | distribution / millisecond | method・route template・status |
| `web.backend.duration` | distribution / millisecond | method・固定domain・status |
| `cli.runs` | counter | 固定job名・status (`ok` / `error`) |
| `cli.duration` | distribution / millisecond | 固定job名・status |
| `cron.deliveries` | counter | job (`gigazine-headline`)・status (`sent` / `failed`) |

Logs / Metricsの送信前hookは上記の運用属性と、安全なSDKメタデータ
（environment・release・SDK名/version・traceの親span ID・Replay ID）以外を除去する。
ユーザーID、任意のadditionalContext、本文、URL query、資格情報は追加送信しない。
Webとbackendは開発モードでは送信せず、CLIは `NODE_ENV=production` とDSNがある場合だけ送信する。
CLIの `--dry-run` は初期化も外部送信もしない。CLIの未知のjob名は `other` にまとめる。
backend / CLIのreleaseは `SENTRY_RELEASE`、なければ `VERCEL_GIT_COMMIT_SHA` を使う。
Webの既存ソースマップuploadは `SENTRY_AUTH_TOKEN` があるビルドでのみ行う。
backend / CLIのソースマップのSentryへのuploadは今回追加していない。

設定画面のFeedbackボタンは日英対応のSDKフォームを明示操作で開く。
名前・メールの入力とユーザー情報の自動補完、スクリーンショットは無効。
利用者が入力した本文はSentryに送られるため、フォーム内で送信先と機密情報を含めない旨を表示する。
既存Replayの保護設定を適用し、Feedback送信時にSDKが紐付けるReplayも無料50件枠を消費し得る。
SDKフォームのsystem theme用の固定style hashをCSPで許可し、未知のinline styleは引き続き拒否する。
ブラウザのZodはJITを無効化し、`Function()` による機能検出も実行しない。
SDK更新時は隔離production E2EでフォームのCSP・失敗後の再送信を再確認する。

## Uptime・Cronの無料枠

2026-11-11のSubscription実画面でDeveloper plan、追加支出 $0を確認した。
当期（11/3–12/2）はErrors 97/5K、Spans約23K/5M、Logs / Metrics 0B/5GB、
Replays 0/50、Cron 0/1、Uptime 1/1、Attachments 0B/1GBだった。
Uptimeの容量表示は既存1枠の使用によるもので、追加monitorやtrialを作らない。

既存Uptime monitor `7685301` を再利用し、対象は `GET https://private.s-hirano.com`、
環境 `production`、5分間隔、timeout 10秒、3回連続失敗で検知、1回成功で回復とした。
旧Preview URLを含むmonitor名は過去の自動生成名で、実際の監視URLとは異なる。
公開画面への到達性を監視し、ログイン後の操作やbackend / DBの正常性を保証しない。

Gigazine Cronは認証・有効化を通った本番実行だけがcheck-inする。
monitor slugは `gigazine-headline`、scheduleは既存Vercelと同じ `0 0 * * *` / UTC、
開始猶予60分、最大実行時間10分。配信の部分失敗（HTTP 500）もerrorとする。
Preview・開発・401ではcheck-inしない。monitorはデプロイ後の最初の正規実行でupsertするため、
未デプロイのコードに対して欠落通知が発生するような事前check-inは送らない。
monitor作成後のスケジュール・受信・通知はProduction反映後に確認する。

既存のperformance monitorと通知は維持する。運用通知はメールを使い、外部連携の有料通知や
実測の基準値がない新規Metricsの閾値通知は追加しない。
週次または異常時にSubscriptionの残量とStats & Usageのaccepted / droppedを確認し、
Logs / Metrics各5GB、Errors 5K、Spans 5M、Replay 50件、Cron / Uptime各1件の枠を超える設定を追加しない。
Attachmentsの1GB枠は利用できるが、スクリーンショットや任意ファイルの自動添付は行わない。

## 運用ダッシュボードと通知

2026-11-12に無料枠内でカスタムダッシュボード
[SPrivate Operations](https://s-hirano-ist-z2.sentry.io/dashboard/10758689/) を作成した。
既定の環境は `production`。Errors、Operational Logs、HTTP Requests、HTTP Latency p95、
CLI Succeeded / Failed、LCP / INP / CLS p75の9ウィジェットを表示する。
HTTP件数・遅延は `span.op:http.server` のspan集計で、samplingの影響を受ける。
全リクエストの件数・遅延を確認する場合はApplication Metricsの
`backend.http.requests` / `backend.http.duration` を利用する。
CLI成否はLogsの `has:job status:ok` / `has:job status:error` で集計する。
デプロイ前のLogs / CLIや、まだ受信していないCLSの空表示を成功・良好と解釈しない。

本番メール通知は既存の
[Notify Suggested Assignees](https://s-hirano-ist-z2.sentry.io/monitors/alerts/6038148/) を再利用する。
実画面で `production`、対象project全体、フィルター `Any event` を確認した。
Uptimeと今後作成されるCronのissueもこのproject通知の対象になるため、同じ通知を重複作成しない。
新規・再発・復旧等の既存条件と、issue owner未割当時のactive memberへの通知を維持する。
意図的な本番障害・テストメールは送らず、初回の実運用でcheck-in受信とメール通知を確認する。
