# Google Booksの単一検索を標準fetchへ移行する

## Metadata

| Field | Value |
| --- | --- |
| Category | Refactor / Dependencies |
| Priority | MEDIUM |
| Status | 未着手 |

## 理由

`packages/scripts/src/enrich-books.ts`でBooks SDK 9.0.0をAPIキー付きISBN検索にだけ使用している。
googleapis-common経由のqsとnode-domexceptionの対策にもなる。
lockfileのrequired dependencyグラフでは、この直接依存に専有されるname@versionは24個。
代替導入後の実削減数・速度は未測定。[棚卸し](../docs/dependency-audit.md)

## 変更方針

- [公式Volumes検索](https://developers.google.com/books/docs/v1/reference/volumes/list)をNode標準fetchで呼ぶ。
  APIキーと既存サービスを維持し、URLSearchParamsで`q=isbn:...`を構築する。
- 使うresponseフィールドだけ型検証する。独自API型は内部に閉じ、不要なGoogle全体の型を持ち込まない。
- タイムアウトと429/5xxの有限再試行を実装する。現行SDKの挙動とAPIの指針を確認して上限を明記。
  それ以外の4xxは再試行せず、APIキーをエラーログに出さない。
- 600ms間隔、見つからない場合のタイトル保持、画像URLのHTTPS化、既定値、本文保持、
  ファイル単位のエラー継続とdry-runを維持する。
- 不要になったSDKのみ削除し、audit/whyで残存依存を確認。
  APIの利用枠・契約は変わらない。SDKのApache-2.0に代わる新ライブラリは不要。

## 完了条件・検証

- [ ] 正常検索、空items、欠損フィールド、不正JSON、429/5xx、timeout、非再試行4xxを検証。
- [ ] dry-runがファイルを書き換えず、失敗した項目の既存内容が壊れないことを検証。
- [ ] `pnpm check:agent`とscripts buildを成功させる。
- [ ] `pnpm audit --json` / `pnpm -r why node-domexception qs`で削減と残存経路を確認。
- [ ] 本番のコンテンツを一括更新せず、fixtureで検証。実装完了後に本issueを削除。
