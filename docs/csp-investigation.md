# Inline style CSP の調査

関連: [#2980](https://github.com/s-hirano-ist/s-private/issues/2980)、Sentry `S-PRIVATE-SENTRY-6F`。
2026-11-03に調査した。同じ `style-src-elem` issue に、異なる発生元の報告がまとまっていた。

## 確認できた発生元

| 報告 | 根拠 | 対応 |
| --- | --- | --- |
| 10/13のアプリ内CSS | event `78e74e980e814d90b1b565f43c037eae` の `source_file` は `/_next/static/immutable/chunks/3btl70mnwsuxf.js`、2行21782列。実際の公開JSの該当位置はnext-themesの `disableTransitionOnChange` によるstyle挿入だった。当時のCSPにはそのhashがなかった。 | `2958a0cc`（10/29）で追加済みの固定hashで許可する。 |
| 11/2のブラウザ操作補助CSS | event `8f3a98eed2114f27a537b43182a16d17` は `source_file` なし、135行93882列。アプリを含まないローカルページをCodex内ブラウザで開いても、同じ位置で `.hover-box{position:fixed;box-sizing:bor` というCSSの違反を再現した。 | アプリのCSSとして許可しない。操作補助のCSSがCSPで拒否されており、アプリの表示不具合を示すものではない。 |

next-themes 0.4.6 の遷移抑制CSSから計算したSHA-256は
`skqujXORqzxt1aE0NNXxujEanPTX6raoqSscTV/Ww/Y=` で、現在の許可hashと一致する。
古い報告すべてを操作補助CSS由来とは扱わない。上表のアプリ由来の問題は既存修正で対応している。

## 操作補助CSSの切り分け

リポジトリのルートで次を実行する。

```sh
mise exec -- node e2e/fixtures/csp-probe.mjs
```

`http://127.0.0.1:4320` を開く。アプリbundle・外部スクリプト・認証情報は使わない。
inline styleを拒否し、診断用の `report-sample` はこのローカルページだけで使う。
報告先も同じローカルサーバーで、POST本文は保存せず破棄する。
ページにはdirective、source、位置、CSS sampleだけを表示する。

- 通常のPlaywright Chromiumでは違反なし、style要素なし。
- Codex内ブラウザでは、操作補助のhover-box CSSがブロックされ、上表と同じ位置・sampleを表示した。
- 本番ページを操作補助付きブラウザで開くと、同様の報告が再び届く可能性がある。
  CSPの動作確認には操作補助を注入しないブラウザを使い、新しい報告は発生元を確認する。

## 回帰確認

`playwright.rum.config.ts` のproduction E2Eで、実アプリについて次を確認する。

1. OSのlight/dark切替にnext-themesが追従し、CSP違反が起きない。
2. 許可していないCSSを意図的に挿入すると `style-src-elem` で拒否され、見た目に適用されない。
3. アプリなしの調査ページでは通常ChromiumがCSSを注入しない。

テストのDSNは偽物、CSP報告先は `https://csp.invalid/report` とし、通信も横取りする。
意図的な違反を本番のSentryに送らない。ProductionのCSP・受信filter・ignore条件は変更しない。
