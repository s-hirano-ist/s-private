# 共通backendの配置と手動切替

この手順はstacked PRを順番に取り込んだ後、担当者が手動で実施する。
Codexはデプロイ・マージを実施しない。接続先を変えるまではNext.js内の共通APIを使用する。

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
Webとbackendを接続したE2Eと切替用環境変数は後続PRで追加する。

## Cronと切替時の確認

独立サービスの `vercel.json` にはscheduleを登録しない。
旧Next.jsのCronを止め、独立サービスの動作確認後に担当者がscheduleを追加する。
パスは `/api/cron/gigazine-headline`、既存scheduleは `0 0 * * *`。
`BACKEND_CRON_ENABLED=true` と `CRON_SECRET` を設定する。同時実行しない。
未認証の入口が401を返すことを先に確認し、実通知の検証は担当者が行う。

切替前に既存Cookie、Auth0 callback、所有者の分離、全CRUD、検索、同期cursor、
旧operationの再送と未完了uploadの再開、5MiB超の分割upload、認証付きmediaを確認する。
実Auth0・外部サービス・Vercel上の制限はローカル検証だけでは確認済みとしない。
