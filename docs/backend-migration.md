# 共通backendへの移行

## 到達する構成

Next.jsはSSR、UI、薄いBFFを担当し、iOSと共通のHono backendへアクセスする。
backendは認証・tenant・ユースケース・永続化・検索・同期・画像処理・通知・Cronを所有する。
ドメイン層は既存の `packages/core` を維持し、Webからの依存を段階的に解消する。
初期の独立実行環境はVercel Node.js。Cloudflare Workers対応は別途検討する。
デプロイとProduction切替は手動で行う。

## 契約と生成

`packages/api-contracts/src` のZodスキーマとHonoルート定義を正本とする。
`docs/openapi/backend-v1.json` はレビュー用の生成スナップショットであり手編集しない。
Swiftもこの1ファイルを入力にし、コピーは保持しない。
DB接続、環境変数、Next.js、coreを読み込まずに生成できる。
`/api/v1` の実処理は後続PRで追加する。
既存の `/api/mobile/v1` はNext.jsのcatch-all Route HandlerからHonoへ委譲する。
`app/src/backend/http/mobile` にHTTP処理を集約し、Next.jsのparams型を持たないcontrollerへ分離する。
Bearer認証・tenant・操作ID・upload・同期の既存ユースケースとwire形式を共有する。
一時的な配置であり、後続PRで独立backendのpackageへ移す。
手書きiOSクライアントとWebの通信経路は引き続き有効。

```bash
pnpm api:generate
pnpm api:check
mise run ios:generate
swift test --package-path ios/Packages/SPrivateAPI
```

`api:check` は一時ディレクトリにOpenAPIを再生成し、Git管理したスナップショットと比較する。
作業中の生成物を書き換えず、TypeScript生成コードの有無には依存しない。
Orvalの型・fetch・Zodモデル・束縛clientはすべて `packages/api-client/src/generated` に生成し、Git管理しない。
api-clientのbuildは必ず契約から再生成し、契約packageへの明示的な依存によりworkspaceのbuild順序を保証する。
個別のapi-client型検査も生成・buildを先に実行する。CIはスナップショットの一致と生成clientの型検査を確認する。
Swiftは同じOpenAPIスナップショットから固定バージョンのCLIを `ios:generate` の前処理で実行する。
生成Swiftソースと `.build` もGit管理しない。
GitHubでは生成スナップショットを既定で折りたたみ、契約・生成設定・通信処理をレビュー対象にする。

Web向けクライアントはOrvalのfetch実装とZodモデルを利用する。
`createBackendClient` がリクエスト単位のbase URL、Cookie／Bearer、fetch adapterを束縛する。
生成したstatus別のレスポンス定義でJSON、エラーコード、未知のstatusを検証し、
失敗時は `ApiHttpError` または `ApiProtocolError` を返す。mutationは自動再試行しない。
空の204応答は公開クライアントで `data: undefined` に正規化する。

コンテンツAPIはドメイン別に型を確定し、同期はactionとdomainのdiscriminatorを使用する。
日時はISO 8601、ID・cursor・同期versionは文字列とする。
画像・書籍のupload metadataもドメイン別の型にし、書籍のratingは数値、tagsは配列とする。
入力の検証とJSON出力の検証はbackendでも実施する。
Better AuthのOAuthプロトコルと内部Cronは、一般クライアント契約から分離する。

## 段階移行

| 順序 | PRの内容 |
| --- | --- |
| 1 | 契約、Orval／Swift生成、型検査、CI |
| 2 | mobile APIをHonoへ置換しNext.js内でホスト |
| 3 | articles／notesのユースケース・永続化を抽出 |
| 4 | images／books・Sharp・MinIOを抽出 |
| 5 | 検索・同期・operation管理を抽出 |
| 6 | 認証・tenant・通知・Cron・観測処理を抽出 |
| 7 | Webを生成クライアントへ切替、永続データキャッシュを撤去 |
| 8 | iOSを生成クライアント・共通APIへ切替 |
| 9 | 独立Hono backendの起動・Vercel配置準備 |
| 10 | 手動デプロイ確認後に接続先切替、暫定実装の撤去 |

各PRは直前のPRをbaseにし、順番にマージ・デプロイできる状態を維持する。
同一機能の二重書き込みは行わず、旧APIと新APIは同じユースケースへ委譲する。
DB・認証・同期cursor・operation・未完了uploadの状態を保持する。
長期の旧iOS互換は維持しないが、移行中の既存URLはクライアント切替まで残す。

Webのユーザーデータ取得はno-storeとリクエスト内の重複排除へ移行する。
iOS変更は次回取得で反映し、サービス間の永続キャッシュ無効化通知を廃止する。
Auth0＋Better Authを維持し、Webの同一originの認証URLはBFFで中継する。
独立稼働への切替前にOAuth callback、画像の最大サイズ転送、外部サービス接続を検証する。
Cronは旧・新で同時に有効化しない。
