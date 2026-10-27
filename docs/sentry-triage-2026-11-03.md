# Sentry エラー調査（2026-11-03）

対象: `s-hirano-ist-z2/s-private-sentry` の過去90日の未解決44件。
件数は調査開始時点。Sentry short ID の共通 prefix は `S-PRIVATE-SENTRY-`。
本番での解消確認前に一括 resolve / ignore せず、次の分類で確認する。
調査後、旧DB接続16件・DB権限2件・Provider不在1件・非JSON応答1件の計20件は、
以下の根拠をSentryのactivityにも記載してresolveした。LCP1件は自動resolve。
その後、release `955d7988` の本番で4domainとsessionの200応答・例外event 0件を確認し、
今回修正の18件もresolveした。Push3件はテストAPIの204とユーザーの実端末受信確認でresolve。
storage1件はユーザーの停止継続指示により過去障害として整理し、機能復旧とは扱わない。
inline CSP1件の追加調査は [#2980](https://github.com/s-hirano-ist/s-private/issues/2980) と
[調査記録](csp-investigation.md) を参照する。
6Fも既存修正と操作補助CSSの切り分け根拠を記録してresolveした。
最終確認では過去90日の未解決issueは0件。将来のCSP報告を除外するfilterは追加していない。

## 今回の修正

| 原因 | ID | 対応と確認 |
| --- | --- | --- |
| プリレンダー中断の503誤変換 | 7D, 7E, 7G, 7H, 7J, 7K, 7M, 7P, 70, 6X, 7A, 71, 6Z, 6Y, 78, 79 | `dispatchBackendRequest` で `unstable_rethrow`。実Next.jsの3種類の内部例外を使う回帰テストで修正前503、修正後rethrowを確認。最新releaseの失敗traceにはbackend HTTP子spanがなく、数msで失敗していた。本番デプロイ後に再確認する。 |
| OAuth prefetch の CSP 違反 | 7Q | エラー画面の再サインインを通常anchorに変更。修正前のproduction E2Eではfetchが発生し、修正後はclick時のdocument requestのみ。 |
| 不正localeのmessage import | 6V | RootLayoutがlocale検証を迂回していた。共有message loader自身で検証し、scanner pathを404にする。修正前production E2Eで `sitemap.xml.zip.json` のimport失敗・500を再現。 |

## 既存対応と残確認

| 分類 | ID | 調査結果・次の確認 |
| --- | --- | --- |
| DB接続timeout・session取得失敗 | 4X, 6D, 6G, 6H, 6J, 6K, 6M, 6N, 6P, 6Q, 6R, 6S, 6T, 6W, 73, 74 | 最終発生10/11–24、旧Web内DB経路。現在は独立backend。直近24hには各一覧とsessionの成功spanがあり、DB系error eventはなかった。一時的な外部障害の恒久解消までは断定しない。 |
| DB権限不足 | 76, 77 | 10/24の `verification.create`、schema public のUSAGE不足。11/3に本番 `/api/sign-in` が307・外部IdP redirect・OAuth cookie設定を返すことを確認した。アプリ変更でDB権限は緩めない。IdPから戻るログイン完了は未確認。 |
| Auth0 Provider not found | 7B | 最終発生10/29。`2958a0cc` の初期化検証・retry/recoveryが既にmainにある。11/3に本番sign-inから外部IdPへのredirect成功を確認。ログイン完了は未確認。 |
| Apple Push VAPID不一致 | 7C, 7F, 7N | `97dec96b` で不一致subscriptionを再購読待ちにし、再送を止める既存対応あり。7Nは11/2にその状態へ遷移した際の一度の診断。端末の再購読と実Push受信は未確認。 |
| 非JSON API応答 | 75 | 最終発生10/24の旧release。独立backendのAPI契約検証と503 envelopeが現在ある。本番APIの401 JSON `UNAUTHORIZED`、直近の認証済み一覧成功span、productionモードE2Eの契約検証を確認した。 |
| MinIO画像取得 | 72 | 最終発生10/24。現在のbackendはobject storageを明示的に停止中。画像機能を復旧したとは扱わない。再有効化時に実オブジェクトを確認する。 |
| inline style CSP | 6F | 古いアプリ由来の報告はnext-themesのCSSで、10/29に固定hash対応済み。最新報告はアプリなしのページでも再現するCodex内ブラウザのhover-box CSSと位置が一致した。アプリのCSPを緩めず、テーマ切替と未知CSS拒否をproduction E2Eで検証する。詳細は [調査記録](csp-investigation.md)。 |
| LCP monitor | 7R | 調査中にSentryが自動resolve。直近24hのarticles LCP p75は約3.65s（5計測）。恒久的な性能改善を実証する十分な標本数ではない。 |

## 検証方法

- `pnpm check:agent`、`pnpm build`、`pnpm knip`。
- `pnpm exec playwright test --config playwright.rum.config.ts` はproduction buildを使う。
  固定のローカルAPI fixtureで認証・一覧・件数を返し、外部DB・Auth0・Pushは呼ばない。
  browserのSentry envelopeもinterceptし、偽DSNのみ使う。
- OAuth retryのdocument遷移、4domainのprefetch/navigation、RUM/Replayの相関・mask・CSPを確認する。
- 本番では対象releaseとenvironmentを絞り、実ユーザー操作後のerror eventと成功spanを照合する。
  ローカルfixtureの成功を本番DB・Push・storageの稼働証明には使わない。
