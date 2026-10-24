# 共通backendの配置と手動切替

この手順はstacked PRを順番に取り込んだ後、担当者が手動で実施する。
Codexはデプロイ・マージを実施しない。最終Web分離PRの適用前に独立backendを配置し、Webの `BACKEND_URL` を設定する。

Vercel Dashboardでの具体的な設定手順は [Vercelセットアップ](backend-vercel-setup.md) を参照。

## MinIOの一時停止

移行先を検討している間、composition rootはMinIO clientを生成せず、
`/api/v1/media/*` と `/api/v1/uploads` 配下の全操作を `NOT_FOUND`（404）で返す。
uploadの作成・再開・完了・取消・期限切れcleanupへ入る前に遮断するため、
停止中に既存upload情報やobjectを削除しない。既存DBの一覧・詳細・記事・ノート・検索・同期は維持する。
画像と書影は表示できず、画像・書影の新規登録も停止する。

この一時停止中は `MINIO_*` と `CF_ACCESS_*` の登録は起動条件に含めない。
ローカル認証時の画像付きsample seedも停止する。既存のsecret、bucket、DB、operationは保持する。
再有効化は一時停止コミットをrevertするPRで行い、必要なMinIO/Cloudflare設定を復旧してから
画像・書影取得、5MiB超upload、再開、thumbnailを再確認する。

## 独立サービス

`services/backend/src/index.ts` はHono appをdefault exportする。
[VercelのHono構成](https://vercel.com/docs/frameworks/backend/hono)に従い、Node.jsで実行する。
Webとは別のVercel projectを作り、Root Directoryを `services/backend` にする。
ルート外のworkspaceをビルドに含める設定を有効にする。
Build Commandは同ディレクトリの `vercel.json` を使用する。
Nodeのバージョンはリポジトリの `.nvmrc` に合わせる。

`GET /health` はプロセスの起動確認用で、DB・外部サービスの正常性は保証しない。
共通APIは `/api/v1`、認証protocolは `/api/auth/*`、サインインは `/api/sign-in`。
iOSのAuth0 audienceはURLと独立した既存値を維持する。

## 環境変数

サービス側は `services/backend/src/env.ts` で起動時に検証する。
既存Webの値をコピーし、DB・MinIO・Qdrant・embedding・Auth0・Better Authを同じ状態へ接続する。
新しいDBや認証アカウントへ切り替えない。

| 設定 | 内容 |
| --- | --- |
| `DATABASE_URL` | 既存CockroachDB。productionは `sslmode=verify-full` |
| `AUTH_SECRET` | 既存Better Authと同じ値。32文字以上 |
| `BETTER_AUTH_URL` | 公開Web origin。backendのホスト名に変更しない |
| `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` / `AUTH0_ISSUER_BASE_URL` | 既存WebのAuth0 provider |
| `MOBILE_API_AUDIENCE` | 既存iOS API identifier |
| `MINIO_*` / `CF_ACCESS_*` | 既存bucketとCloudflare Access credentials |
| `QDRANT_URL` / `QDRANT_API_KEY` / `QDRANT_COLLECTION_NAME` / `EMBEDDING_URL` | 既存検索サービス |
| `PUSHOVER_*` | 既存通知設定 |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_PRIVATE_KEY` / `WEB_PUSH_SUBJECT` | 同じVAPID鍵 |
| `NEXT_PUBLIC_SENTRY_DSN` | backendのエラー監視先 |
| `CRON_SECRET` | Cron入口のBearer secret |
| `BACKEND_CRON_ENABLED` | 既定false。旧Cron停止後だけtrue |

`LOCAL_DEV_MODE=true` はローカル専用で、Vercel上では認証を迂回しない。
productionでのTLS検証無効化は起動時に拒否する。
OAuthの開始・callback・sign-outは公開WebのBFFを経由する。
公開Web originは検証し、OAuth stateとsessionの複数Set-Cookieを維持する。

## ローカルの単体確認

Docker依存サービス・migration・検索初期化は従来の `pnpm dev` の手順を使う。
独立backendだけを起動する場合は、ルートから以下を実行する。

```bash
pnpm packages:build
mise exec -- pnpm --filter s-private-backend dev
```

既定のlisten先は `127.0.0.1:3002`。`BACKEND_PORT` で変更できる。
`.env.local` の既存local認証設定を使用する。
Web側の `BACKEND_URL=http://localhost:3002` を設定すると独立サービスへ接続する。
通常の `pnpm dev` ／ `pnpm dev:app` はbackendも起動し、Webの接続先を既定で `http://127.0.0.1:3002` に設定する。
Webは `BACKEND_URL` を必須とし、Next.js内の暫定handlerは撤去済み。
別terminalでbackendを起動済みの場合は、Webを以下で起動する。

```bash
mise exec -- env BACKEND_URL=http://localhost:3002 pnpm --filter s-private-app dev
```

`BACKEND_URL` は末尾slash・path・query・credentialsのないoriginを指定する。
HTTPはlocalhost／127.0.0.1だけ許可し、VercelではHTTPSのbackend originを設定する。
Vercel Previewでは `app/vercel.json` の `relatedProjects` でbackend projectを関連付け、
`VERCEL_RELATED_PROJECTS` から同じブランチのbackend originを自動解決する。
PRごとの `BACKEND_URL` 登録は不要。Productionとローカルでは明示した `BACKEND_URL` を使う。
関連情報のないPreviewでは明示した `BACKEND_URL` が必要で、backend Productionへ自動接続しない。
backend projectを作り直した場合は `relatedProjects` のproject IDを更新する。
ブラウザは公開Webの同一originのAPIを使い、SSRも同じBFF transportを使う。
backend障害時に別ホストへmutationを再送しない。自動retryも追加しない。

## Cronと切替時の確認

独立サービスの `vercel.json` にはscheduleを登録しない。
このスタックのWeb Cron撤去PRで旧Next.jsのscheduleと入口を削除する。
旧Productionの停止を確認し、独立サービスの動作確認後に担当者がscheduleを追加する。
パスは `/api/cron/gigazine-headline`、既存scheduleは `0 0 * * *`。
`BACKEND_CRON_ENABLED=true` と `CRON_SECRET` を設定する。同時実行しない。
未認証の入口が401を返すことを先に確認し、実通知の検証は担当者が行う。

切替前に既存Cookie、Auth0 callback、所有者の分離、全CRUD、検索、同期cursor、
旧operationの再送と未完了uploadの再開、5MiB超の分割upload、認証付きmediaを確認する。
実Auth0・外部サービス・Vercel上の制限はローカル検証だけでは確認済みとしない。

## 公開Webの接続先切替

旧 `/api/mobile/v1` 撤去PRは、`/api/v1` 対応iOSの配布と接続確認後に適用する。
旧クライアントへの長期互換は提供しない。端末のキュー・draft・cursorとサーバーのoperation・uploadは保持する。

backendの単体検証後に、Webの `BACKEND_URL` をbackendのHTTPS originへ設定して再デプロイする。
WebのAuth0 callback URLとCookieのoriginは維持する。backendの `BETTER_AUTH_URL` は公開Webを指定する。
この実装はVercelのbypass secretを送らない。対象backendはWebとiOSから到達可能にし、Deployment Protectionで拒否されない設定を担当者が確認する。
公開URLの確認だけで切替済みと判断せず、認証・所有者・実CRUD・同期・uploadを確認する。
接続先を戻す場合は書き込みを停止して状態を確認し、互換性のあるbackend deploymentへ手動で `BACKEND_URL` を戻す。
最終Webには組み込みhandlerがないため、URLを削除しても旧構成へ戻らない。
接続済み通信を障害時に暗黙に旧handlerへfallbackしない。
