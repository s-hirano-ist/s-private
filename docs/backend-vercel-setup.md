# VercelでWebと共通backendを配置する

現在はMinIOをコード上で一時停止している。画像・書影取得とuploadは404となり、
MinIO/Cloudflareの資格情報なしで起動できる。再有効化時の条件は
[MinIOの一時停止](backend-deployment.md#minioの一時停止) を参照。

Productionの環境変数はVercelで手動管理し、PreviewはDopplerのサービス別configから同期する。
デプロイ・認証・Cronの稼働状態は配置後に検証する。
移行PRは下から順番に取り込み、最終Web分離PRを本番へ適用する前にbackendを稼働させる。
旧mobile入口の撤去は `/api/v1` 対応iOSの配布・接続確認後に行う。

## 1. backendのVercel projectを作る

1. Vercel Dashboardで既存Webと同じteamを選び、**Add New → Project** から同じGitHub repositoryをimportする。
2. Webとは別のproject名を付け、**Root Directory** を `apps/backend` に設定する。
3. **Build and Deployment → Root Directory** で **Include source files outside of the Root Directory in the Build Step** を有効にする。`packages/*` とルートのworkspace/lockfileが必要。
4. FrameworkはHonoの自動検出を使用する。入口は `apps/backend/src/index.ts` のdefault export。`api/index.ts` やNext.js adapterを追加しない。
5. Node.jsは **24.x** を選び、ビルドログのversionがリポジトリの `.nvmrc` / `engines` を満たすことを確認する。
6. Install Commandはworkspaceルートのlockfileを使う `pnpm install --frozen-lockfile`。Build Commandは `apps/backend/vercel.json` の `pnpm --filter s-private-backend... -r run build` を使用する。Output Directoryを静的サイト用の `dist` などへ上書きしない。
7. Functionsのregionは既存CockroachDBに近いregionを選ぶ。HTTP APIとSharpを使用するためNode.jsで実行する。Cloudflare Workersへの配置はこの構成の対象外。
8. 以下の環境変数を登録してから担当者がdeployする。Cron scheduleはリポジトリの設定を使用し、PreviewではCronを無効にする。

Vercelの [Hono](https://vercel.com/docs/frameworks/backend/hono)、[monorepo](https://vercel.com/docs/monorepos)、[Root Directory](https://vercel.com/docs/builds/configure-a-build#root-directory) の手順に対応する。

## 2. 環境変数を分ける

具体的なbackend変数一覧と起動時の制約は [共通backendの環境変数](backend-deployment.md#環境変数) と `apps/backend/src/env.ts` を参照。

| project | 必要な設定 |
| --- | --- |
| backend | 既存DB、Auth0、Better Auth、MinIO/Cloudflare Access、Qdrant/embedding、監視・通知の設定 |
| Web (`apps/web`) | `BACKEND_URL`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`、Sentryの既存設定 |
| iOS | Git管理外の `Local.xcconfig` に `MOBILE_API_BASE_URL=https:/$()/BACKEND_HOST/api/v1`。既存Auth0 domain/client ID/audienceを維持 |

backendのProductionには既存Productionと同じDB・bucket・`AUTH_SECRET`・VAPID鍵を設定する。新規DBや新規ユーザーを作らず、既存のAccount・Session・operation・upload・sync状態を引き継ぐ。`AUTH_SECRET` は32文字以上。移行のために鍵を再生成しない。

backendの `BETTER_AUTH_URL` は **公開Webのorigin**（例: `https://private.s-hirano.com`）。backendのoriginには変更しない。
Webの `BACKEND_URL` はbackendのHTTPS originで、`/api/v1`・末尾slash・queryを含めない。
Production Webの `BETTER_AUTH_URL` も公開Web originを指定する。
Previewは両projectで `BETTER_AUTH_URL` を設定せず、リクエストのWeb originを検証して使用する。
ブラウザは同一originのBFFを使うため、CORSを広く開放する設定は不要。

WebへDB・MinIO・Auth0 client secret・VAPID秘密鍵・Pushover・Qdrantの資格情報を渡す必要はなくなる。backendの確認と切替後にWeb projectから不要な変数を削除する。共有secret自体は変更しない。

Previewには既存のPreview用DB・bucket・Auth0設定を使い、ProductionのDBや通知先と混在させない。Preview backendとPreview Webを対応させ、WebのPreview用 `BACKEND_URL` をそのbackendへ向ける。必要なら固定のPreview domainを使用する。現在の認証設定は公開Web originと既存teamの `s-private-*-s-hirano-ist-team.vercel.app` および `memdex-web-*-s-hirano-ist-team.vercel.app` を許可する。別名のWeb project/domainへ変える場合は、認証の許可hostとAuth0の許可URLを合わせて変更・確認する。

`LOCAL_DEV_MODE` は配置先に登録せず既定値falseを使う。Previewの `BACKEND_CRON_ENABLED=false` は明示する。`LOCAL_AUTH_*` は登録しない。`VERCEL=1` ではlocal認証を利用できない。
ProductionのDBは `sslmode=verify-full` を使い、`NODE_TLS_REJECT_UNAUTHORIZED=0` を設定しない。ローカルファイルへの証明書pathをそのままコピーしない。

Productionの `DATABASE_URL` は既存の `s-prod-runtime` / `prod-db` 用接続文字列を使う。
`s-prod` はGitHub Actionsのmigration用で、backend実行用へ転用しない。
移行時は [DBロールの手順](cockroachdb-role-minimization-runbook.md) に従い、
接続ユーザー・DB、public schemaのUSAGE、既存テーブルのDML権限を確認する。
OAuth開始時にも `verification` へのINSERTが発生するため、DB接続や `/health` の成功だけでは不十分。
`42501` が出た場合は接続先とユーザーを先に確認し、認証を迂回したりadmin権限を付与したりしない。

backendにも既存Sentryの `NEXT_PUBLIC_SENTRY_DSN` を登録し、変更後に再デプロイする。
HTTP hostの未処理例外は秘密値を伏せた診断情報をVercelログとSentryへ記録し、
レスポンス完了前に最大2秒Sentryの送信を待つ。Cookie・Authorization・OAuth queryを記録しない。

## 3. Deployment Protectionと認証を確認する

backend実装は `apps/backend` に集約する。Root Directory、起動入口、Cron、環境変数は変更不要。

### 配布成果物の起動を確認する

Vercelのビルド成功だけでは起動成功を保証しない。workspaceのpackage exportsは
TypeScriptソースを指しているため、`apps/backend/vercel.json` の `includeFiles` で
サービス内の実装・core・DBのソースをFunctionに含める。Node.js 24の型除去で実行するため、
対象のTypeScript設定では `erasableSyntaxOnly` を有効にする。
constructorのparameter propertyなど、JavaScriptへの変換が必要な構文は使用しない。
型検査の回帰テストに加え、生成されたFunctionをリポジトリ外へ展開し、
`.vc-config.json` の `filePathMap` に記載されたファイルとsymlinkもworkspaceルートから対応する出力パスへ複製する。
CLIがアップロード時に参照するこれらのファイルを含めた状態で、
次のコマンドで実際のentrypointをロードする。認証情報はテスト専用のダミー値を使用する。

```bash
node apps/backend/scripts/smoke-runtime.mjs /ABSOLUTE/FUNCTION/apps/backend/src/index.js
```

`/health: 200` と `/api/v1/session: 401` の両方が出力されることを確認する。
`ERR_MODULE_NOT_FOUND` や `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` が出た成果物は公開しない。

PreviewのRelated Projectsはproject IDだけでなく解決に使う名前も一致させる。
現在のbackend project名は `memdex-backend`。rename時にはWebの解決処理も更新する。

### Auth0の設定を確認する

ProductionのWebとbackendの `BETTER_AUTH_URL` は `https://private.s-hirano.com`、
Webの `BACKEND_URL` は `https://api.s-hirano.com` とする。
Auth0のWeb Applicationで、Allowed Callback URLsには
`https://private.s-hirano.com/api/auth/callback/auth0`、Allowed Web Originsと
Allowed Logout URLsには `https://private.s-hirano.com` を登録する。
Previewも対応するWeb originのcallbackを許可し、Productionのclient secretやDBを共有しない。
Discoveryとログイン画面までの疎通だけではclient secretのtoken交換・DB永続化・session発行は
検証できないため、実際のログイン完了まで確認する。

backendはWebサーバーとiOSからHTTPで到達できる必要がある。Vercel Authenticationで保護すると、アプリの認証に到達する前に拒否される。
この実装はVercelのbypass secretを送らない。backendの対象deploymentについて、projectの **Settings → Deployment Protection** で到達可能な設定にする。Web projectの保護設定とは分ける。

とくにiOSへbypass secretを埋め込まない。PreviewをVercel Authenticationで保護したままにする場合は、現構成のWeb/iOSとの接続確認には使えない。
[Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) は運用ツール向けで、アプリのBearer/Cookie認証の代替ではない。

公開backendに対して次を確認する。

```bash
BACKEND_ORIGIN=https://YOUR_BACKEND_HOST
curl --fail --show-error "$BACKEND_ORIGIN/health"
curl --silent --output /dev/null --write-out '%{http_code}\n' "$BACKEND_ORIGIN/api/v1/session"
```

前者は200、未認証の後者は401が期待値。VercelのHTMLログイン画面が返る場合はProtection設定を見直す。`/health` の200だけではDB・認証・storageの接続は確認できない。

Auth0のWeb Applicationは既存のcallback **`PUBLIC_WEB_ORIGIN/api/auth/callback/auth0`** とAllowed Web Origins/Logout URLsを維持する。backendのcallback URLへ付け替えない。OAuthの開始・callback・sign-outとsession CookieはWeb BFFを通る。
iOSのNative ApplicationとAPI audienceは既存値を維持し、backendホスト名に合わせてaudienceを変更しない。

## 4. Web・iOSを切り替える

1. backend単体で認証・所有者分離・CRUD・検索・差分同期を確認する。
2. Preview Webの `BACKEND_URL` を設定して再deployする。既存Cookie、Auth0 callback、sign-out、全ドメインの作成・削除・一覧・詳細・画像を確認する。
3. 5MiB超の画像・書影を1MiB分割で送信し、中断後のupload再開・thumbnail・operationの再送を確認する。Vercel上のrequest/response制限やtimeoutはローカル検証だけで確認済みとしない。
4. iOSの接続先をbackendの `/api/v1` に設定し、実端末で認証・同期・送信済みoperationの再送・未完了uploadの再開を確認して配布する。端末のdraft・送信queue・cursorを消さない。
5. Production backendを既存Production状態へ接続する。Web Productionの `BACKEND_URL` を設定してから最終Web分離PRをdeployする。最終構成はURL必須で、Next.js内のdomain処理へfallbackしない。
6. 旧URLの404と、対応iOSが `/api/v1` で正常に動作することを確認する。
7. 以下のCron切替を実施し、最後にWebの不要な資格情報を除去する。

切替の実際の適用順序は以下。PRを順番にmergeして自動deployする場合は、旧mobile撤去PRの前に対応iOSの配布を済ませる。

| 段階 | 手動条件 |
| --- | --- |
| #2905 独立backend / #2906 Web BFF | backend配置、Webの接続先設定・認証確認 |
| #2900までの生成iOS client | `/api/v1` 対応版を配布して接続確認 |
| #2911 旧mobile撤去 | 上の配布完了後に適用。端末queueとserver状態を保持 |
| #2918 Web Cron撤去 | 旧Productionのschedule停止確認後だけbackend Cronを有効化 |
| #2920 Web最終分離 | backend配置とWebの `BACKEND_URL` 設定が必須 |

後続PRを先に本番へ出すためにstackの依存順序を崩さない。

## 5. Cronを一度だけ稼働させる

1. Web Cron撤去PRをProductionへdeployし、旧Web projectのCron一覧からscheduleが消えたことを確認する。過去deploymentをroll backして旧Cronを復活させない。
2. backend Productionに既存 `CRON_SECRET` と通知設定を登録する。PreviewではCronを有効化しない。
3. backendのProductionに `BACKEND_CRON_ENABLED=true` と `CRON_SECRET` を設定し、`apps/backend/vercel.json` の次のscheduleを含む成果物をdeployする。scheduleはリポジトリに登録済みで、追加作業は不要。

```json
{
  "crons": [
    { "path": "/api/cron/gigazine-headline", "schedule": "0 0 * * *" }
  ]
}
```

4. 未認証呼び出しが401であることを確認する。認証付きの実通知確認は担当者が行い、配信件数とSentryを確認する。

backendのscheduleはProduction用に登録済み。ProductionのCron有効化には `CRON_SECRET` が必要で、Previewは常に無効とする。旧Webとbackendを同時に稼働させない。詳細は [Cronの手動切替](backend-deployment.md#cronと切替時の確認) と [Vercel Cron](https://vercel.com/docs/cron-jobs) を参照。

## 6. 問題があった場合

書き込みを止めて、どのdeployment・DB・bucketへ書いたかと、PENDING/FAILED operation・未完了uploadを確認する。
両クライアントと共通backendを互換性のあるdeploymentへ戻し、既存DB状態を保ったまま再開する。
最終Webには組み込みbackendがないため、`BACKEND_URL` を削除しても旧実装には戻らない。組み込み構成へ戻す場合は、担当者がその構成を持つWeb deploymentへ明示的にroll backする必要がある。
Cronを止める場合はschedule削除と `BACKEND_CRON_ENABLED=false` を行い、旧WebのCronを重複して復活させない。
DBをrollbackで作り直す、既存Accountを再登録する、端末queue/draft/cursorを初期化する手順にはしない。

ローカルで確認済みなのは、標準検証、本番build、独立backendとWeb BFFの主要E2E、session/stale Cookie、CRUD、operation再送、画像・書影の5MiB超分割uploadと再開・thumbnail。
Vercel実配置、実Auth0 callback、実Push/Cron配信、実端末での切替は手動確認として残る。
