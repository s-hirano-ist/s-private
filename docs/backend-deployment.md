# 共通backendの配置と手動切替

この手順はstacked PRを順番に取り込んだ後、担当者が手動で実施する。
Codexはデプロイ・マージを実施しない。最終Web分離PRの適用前に独立backendを配置し、Webの `BACKEND_URL` を設定する。

Vercel Dashboardでの具体的な設定手順は [Vercelセットアップ](backend-vercel-setup.md) を参照。

## 独立サービス

`apps/backend/src/index.ts` はHono appをdefault exportする。
[VercelのHono構成](https://vercel.com/docs/frameworks/backend/hono)に従い、Node.jsで実行する。
Webとは別のVercel projectを作り、Root Directoryを `apps/backend` にする。
ルート外のworkspaceをビルドに含める設定を有効にする。
Build Commandは同ディレクトリの `vercel.json` を使用する。
Nodeのバージョンはリポジトリの `.nvmrc` に合わせる。

`GET /health` はプロセスの起動確認用で、DB・外部サービスの正常性は保証しない。
共通APIは `/api/v1`、認証protocolは `/api/auth/*`、サインインは `/api/sign-in`。
iOSのAuth0 audienceはURLと独立した既存値を維持する。

## 環境変数

サービス側は `apps/backend/src/env.ts` で起動時に検証する。
既存Webの値をコピーし、DB・Qdrant・Auth0・Better Authを同じ状態へ接続する。
新しいDBや認証アカウントへ切り替えない。

| 設定 | 内容 |
| --- | --- |
| `DATABASE_URL` | 既存CockroachDB。productionは `sslmode=verify-full` |
| `AUTH_SECRET` | 既存Better Authと同じ値。32文字以上 |
| `BETTER_AUTH_URL` | Production・ローカルの公開Web origin。Previewは未設定とし、BFFが検証済みのWeb originを渡す |
| `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` / `AUTH0_ISSUER_BASE_URL` | 既存WebのAuth0 provider |
| `MOBILE_API_AUDIENCE` | 既存iOS API identifier |
| `S3_*` | [B2バケットと専用Application Key](backblaze-b2-setup.md) |
| `QDRANT_URL` / `QDRANT_API_KEY` / `QDRANT_COLLECTION_NAME` | 既存のQdrant Cloud cluster・API key・collection |
| `PUSHOVER_*` | 既存通知設定 |
| `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_PRIVATE_KEY` / `WEB_PUSH_SUBJECT` | 同じVAPID鍵 |
| `NEXT_PUBLIC_SENTRY_DSN` | backendのエラー監視先 |
| `CRON_SECRET` | Cron入口のBearer secret |
| `BACKEND_CRON_ENABLED` | 既定false。旧Cron停止後だけtrue |

本番・Previewと通常の取り込みは、ベクトル保存と文章のembedding生成の両方にQdrant Cloudを使う。
`EMBEDDING_URL` はVercelでは不要で、既存値が残っていても使用しない。
Cloud clusterのInferenceを有効にし、既存collectionと同じモデル・次元数を維持する。
既定モデルは `intfloat/multilingual-e5-small`、384次元。変更する場合は既存データとの整合性を確認する。
TEIは `LOCAL_DEV_MODE=true` かつVercel外・非productionのローカル開発でのみ、`EMBEDDING_URL` により指定できる。

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
Vercel Previewでは `apps/web/vercel.json` の `relatedProjects` でbackend projectを関連付け、
`VERCEL_RELATED_PROJECTS` から同じブランチのbackend originを自動解決する。
PRごとの `BACKEND_URL` 登録は不要。Productionとローカルでは明示した `BACKEND_URL` を使う。
関連情報のないPreviewでは明示した `BACKEND_URL` が必要で、backend Productionへ自動接続しない。
backend projectを作り直した場合は `relatedProjects` のproject IDを更新する。
ブラウザは公開Webの同一originのAPIを使い、SSRも同じBFF transportを使う。
backend障害時に別ホストへmutationを再送しない。自動retryも追加しない。

## Cronと切替時の確認

独立サービスの `vercel.json` にProduction用scheduleを登録する。
旧Next.jsにはscheduleとCron入口を置かず、配信をbackendに集約する。
パスは `/api/cron/gigazine-headline`、既存scheduleは `0 0 * * *`。
Productionに `BACKEND_CRON_ENABLED=true` と `CRON_SECRET` を設定する。同時実行しない。
Previewは `BACKEND_CRON_ENABLED=false` を維持し、誤って有効化した場合は起動を拒否する。
未認証の入口が401を返すことを先に確認し、実通知の検証は担当者が行う。

切替前に既存Cookie、Auth0 callback、所有者の分離、全CRUD、検索、同期cursor、
旧operationの再送と未完了uploadの再開、5MiB超の分割upload、認証付きmediaを確認する。
実Auth0・外部サービス・Vercel上の制限はローカル検証だけでは確認済みとしない。

## 公開Webの接続先切替

旧 `/api/mobile/v1` 撤去PRは、`/api/v1` 対応iOSの配布と接続確認後に適用する。
旧クライアントへの長期互換は提供しない。端末のキュー・draft・cursorとサーバーのoperation・uploadは保持する。

backendの単体検証後に、Webの `BACKEND_URL` をbackendのHTTPS originへ設定して再デプロイする。
WebのAuth0 callback URLとCookieのoriginは維持する。Production backendの `BETTER_AUTH_URL` は公開Webを指定する。
この実装はVercelのbypass secretを送らない。対象backendはWebとiOSから到達可能にし、Deployment Protectionで拒否されない設定を担当者が確認する。
公開URLの確認だけで切替済みと判断せず、認証・所有者・実CRUD・同期・uploadを確認する。
接続先を戻す場合は書き込みを停止して状態を確認し、互換性のあるbackend deploymentへ手動で `BACKEND_URL` を戻す。
最終Webには組み込みhandlerがないため、URLを削除しても旧構成へ戻らない。
接続済み通信を障害時に暗黙に旧handlerへfallbackしない。

## Previewの認証origin

Previewのfrontend・backendでは `BETTER_AUTH_URL` を設定しない。
WebのSSRはリクエストのhostをこのteamのWeb deployment allowlistで検証してoriginを決める。
BFFはOAuth開始・callbackも同じWeb originとしてbackendへ転送する。
backendは許可したWeb originのみでURLを復元し、originのない直接OAuthリクエストを拒否する。
Better Authの動的baseURLにもlocalhost・Productionへのfallbackを設けない。
Previewで新規作成するAccountのissuer既定値はAuth0 issuerとし、Productionの既存値は維持する。
Auth0のPreview用Web applicationに、対象Web callbackとWeb Origins・Logout URLsを登録する。
backendのVercelログイン保護は解除し、アプリのCookie／Bearer認証・所有者検証は維持する。
frontendのVercelログイン保護は維持する。実Auth0のログイン完了は配置後に別途検証する。
