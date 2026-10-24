# VercelでWebと共通backendを配置する

この手順は担当者が手動で実施する。デプロイ・環境変数の登録・Cronの有効化は未実施。
移行PRは下から順番に取り込み、最終Web分離PRを本番へ適用する前にbackendを稼働させる。
旧mobile入口の撤去は `/api/v1` 対応iOSの配布・接続確認後に行う。

## 1. backendのVercel projectを作る

1. Vercel Dashboardで既存Webと同じteamを選び、**Add New → Project** から同じGitHub repositoryをimportする。
2. Webとは別のproject名を付け、**Root Directory** を `services/backend` に設定する。
3. **Build and Deployment → Root Directory** で **Include source files outside of the Root Directory in the Build Step** を有効にする。`packages/*` とルートのworkspace/lockfileが必要。
4. FrameworkはHonoの自動検出を使用する。入口は `services/backend/src/index.ts` のdefault export。`api/index.ts` やNext.js adapterを追加しない。
5. Node.jsは **24.x** を選び、ビルドログのversionがリポジトリの `.nvmrc` / `engines` を満たすことを確認する。
6. Install Commandはworkspaceルートのlockfileを使う `pnpm install --frozen-lockfile`。Build Commandは `services/backend/vercel.json` の `pnpm --filter s-private-backend... -r run build` を使用する。Output Directoryを静的サイト用の `dist` などへ上書きしない。
7. Functionsのregionは既存CockroachDBに近いregionを選ぶ。HTTP APIとSharpを使用するためNode.jsで実行する。Cloudflare Workersへの配置はこの構成の対象外。
8. 以下の環境変数を登録してから担当者がdeployする。初期状態ではCron scheduleを登録しない。

Vercelの [Hono](https://vercel.com/docs/frameworks/backend/hono)、[monorepo](https://vercel.com/docs/monorepos)、[Root Directory](https://vercel.com/docs/builds/configure-a-build#root-directory) の手順に対応する。

## 2. 環境変数を分ける

具体的なbackend変数一覧と起動時の制約は [共通backendの環境変数](backend-deployment.md#環境変数) と `services/backend/src/env.ts` を参照。

| project | 必要な設定 |
| --- | --- |
| backend | 既存DB、Auth0、Better Auth、MinIO/Cloudflare Access、Qdrant/embedding、監視・通知の設定 |
| Web (`app`) | `BACKEND_URL`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`、Sentryの既存設定 |
| iOS | Git管理外の `Local.xcconfig` に `MOBILE_API_BASE_URL=https:/$()/BACKEND_HOST/api/v1`。既存Auth0 domain/client ID/audienceを維持 |

backendのProductionには既存Productionと同じDB・bucket・`AUTH_SECRET`・VAPID鍵を設定する。新規DBや新規ユーザーを作らず、既存のAccount・Session・operation・upload・sync状態を引き継ぐ。`AUTH_SECRET` は32文字以上。移行のために鍵を再生成しない。

backendの `BETTER_AUTH_URL` は **公開Webのorigin**（例: `https://private.s-hirano.com`）。backendのoriginには変更しない。
Webの `BACKEND_URL` はbackendのHTTPS originで、`/api/v1`・末尾slash・queryを含めない。
Webの `BETTER_AUTH_URL` も公開Web originを指定する。
ブラウザは同一originのBFFを使うため、CORSを広く開放する設定は不要。

WebへDB・MinIO・Auth0 client secret・VAPID秘密鍵・Pushover・Qdrantの資格情報を渡す必要はなくなる。backendの確認と切替後にWeb projectから不要な変数を削除する。共有secret自体は変更しない。

Previewには既存のPreview用DB・bucket・Auth0設定を使い、ProductionのDBや通知先と混在させない。Preview backendとPreview Webを対応させ、WebのPreview用 `BACKEND_URL` をそのbackendへ向ける。必要なら固定のPreview domainを使用する。現在の認証設定は公開Web originと既存teamの `s-private-*-s-hirano-ist-team.vercel.app` を許可する。別名のWeb project/domainへ変える場合は、認証の許可hostとAuth0の許可URLを合わせて変更・確認する。

`LOCAL_DEV_MODE=false`、`BACKEND_CRON_ENABLED=false` を配置先で明示する。`LOCAL_AUTH_*` は登録しない。`VERCEL=1` ではlocal認証を利用できない。
ProductionのDBは `sslmode=verify-full` を使い、`NODE_TLS_REJECT_UNAUTHORIZED=0` を設定しない。ローカルファイルへの証明書pathをそのままコピーしない。

## 3. Deployment Protectionと認証を確認する

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
3. backendの `BACKEND_CRON_ENABLED=true` を設定し、担当者が `services/backend/vercel.json` に次のscheduleを追加してdeployする。既存の `buildCommand` は残す。

```json
{
  "crons": [
    { "path": "/api/cron/gigazine-headline", "schedule": "0 0 * * *" }
  ]
}
```

4. 未認証呼び出しが401であることを確認する。認証付きの実通知確認は担当者が行い、配信件数とSentryを確認する。

初期状態のbackendはCron無効・schedule未登録。旧Webとbackendを同時に稼働させない。詳細は [Cronの手動切替](backend-deployment.md#cronと切替時の確認) と [Vercel Cron](https://vercel.com/docs/cron-jobs) を参照。

## 6. 問題があった場合

書き込みを止めて、どのdeployment・DB・bucketへ書いたかと、PENDING/FAILED operation・未完了uploadを確認する。
両クライアントと共通backendを互換性のあるdeploymentへ戻し、既存DB状態を保ったまま再開する。
最終Webには組み込みbackendがないため、`BACKEND_URL` を削除しても旧実装には戻らない。組み込み構成へ戻す場合は、担当者がその構成を持つWeb deploymentへ明示的にroll backする必要がある。
Cronを止める場合はschedule削除と `BACKEND_CRON_ENABLED=false` を行い、旧WebのCronを重複して復活させない。
DBをrollbackで作り直す、既存Accountを再登録する、端末queue/draft/cursorを初期化する手順にはしない。

ローカルで確認済みなのは、標準検証、本番build、独立backendとWeb BFFの主要E2E、session/stale Cookie、CRUD、operation再送、画像・書影の5MiB超分割uploadと再開・thumbnail。
Vercel実配置、実Auth0 callback、実Push/Cron配信、実端末での切替は手動確認として残る。
