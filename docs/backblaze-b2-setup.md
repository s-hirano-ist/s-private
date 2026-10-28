# Backblaze B2のセットアップ

本番・Previewのobject storageはBackblaze B2、ローカルはMinIOを使う。
接続実装はAWS SDK v3で共通化し、WebやiOSは従来どおり認証付きbackend APIを経由する。
B2の公開URLやブラウザ用資格情報は使用しない。MinIOからのデータコピーは行わない。

## 会員登録とバケット作成

1. [Backblaze B2](https://www.backblaze.com/cloud-storage)でアカウントを作成し、メール確認を完了する。
2. B2 Cloud Storageを有効化する。登録画面でリージョンを選択し、backendの配置地域からの距離を考慮する。
   表示される料金・支払い設定を確認し、必要な登録を行う。アカウントの多要素認証も設定する。
3. Web ConsoleのBucketsからバケットを作成する。名前は一意にし、アクセスを**Private**にする。
   ProductionとPreviewで別のバケットを用意する。Object Lockは有効にしない。
4. バケット詳細のS3 Endpointを控える。例は`https://s3.us-west-004.backblazeb2.com`。
   Regionにはendpointに対応する`us-west-004`を使う。バケット名やパスをendpointへ追加しない。
5. Application Keysから専用キーを作成し、対象バケットだけに限定する。
   読み取り・書き込み・一覧・削除を許可し、ファイル名prefix制限は空欄にする。
   このアプリはList Bucketsを使わないため、全バケット名の一覧権限は不要。
6. 作成時の`keyID`と`applicationKey`を安全に保管する。applicationKeyは後から再表示できない。
   ProductionとPreviewはキーも分離する。master application keyは使わない。

詳細は[公式Quickstart](https://www.backblaze.com/docs/cloud-storage-developer-quick-start-guide)、
[Application Keyの権限](https://www.backblaze.com/docs/cloud-storage-s3-compatible-app-keys)、
[AWS SDK v3接続例](https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2)を参照。

## 環境設定

| 環境変数 | B2で設定する値 |
| --- | --- |
| `S3_ENDPOINT` | バケット詳細のHTTPS S3 endpoint |
| `S3_REGION` | endpointに対応するregion |
| `S3_BUCKET_NAME` | バケット名（bucket IDではない） |
| `S3_ACCESS_KEY_ID` | Application KeyのkeyID |
| `S3_SECRET_ACCESS_KEY` | Application KeyのapplicationKey |
| `S3_FORCE_PATH_STYLE` | `false` |

ProductionはVercel Dashboardの**backend project**のEnvironment Variablesへ登録する。
Previewは既存のDopplerサービス別configと同期フローへ同じS3変数を登録する。
環境ごとに対応するバケットとキーを設定し、Vercelの資格情報はSecretとして保存する。
設定後は新しいdeploymentが必要。Web projectにはS3資格情報を設定しない。
旧`MINIO_*`接続変数と`CF_ACCESS_*`は使用しない。B2にCloudflare Accessは不要。

ローカルの`.env.local`には次を設定する。
`MINIO_ROOT_USER`と`MINIO_ROOT_PASSWORD`はDockerのローカルMinIOを初期化するために残す。

```dotenv
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=s-private-local
S3_ACCESS_KEY_ID=local-minio-user
S3_SECRET_ACCESS_KEY=local-minio-password
S3_FORCE_PATH_STYLE=true
MINIO_ROOT_USER=local-minio-user
MINIO_ROOT_PASSWORD=local-minio-password
```

`pnpm dev`がローカルMinIOとバケットを初期化する。本番endpointはHTTPS必須。

## 元データからのingest

B2へ投入する場合は、実行元の`.env.local`のS3設定を対象B2バケットに変更する。
DB、`USERNAME_TO_EXPORT`、`S_CONTENTS_PATH`、Pushoverの既存設定も必要。
本番DBへ実行する前にdry-runの対象と件数を確認する。

```sh
pnpm --filter @s-hirano-ist/s-scripts ingest-images --dry-run
pnpm --filter @s-hirano-ist/s-scripts ingest-books --dry-run
pnpm --filter @s-hirano-ist/s-scripts ingest-images
pnpm --filter @s-hirano-ist/s-scripts ingest-books
```

画像の元ファイルは`$S_CONTENTS_PATH/image/dump/`、書籍は`markdown/book/`と`image/book/`に置く。
画像ingestはDB登録済みのpathをスキップする。書籍も既存データの更新条件に従うため、
空のB2へ接続先を変更して再実行するだけでは、全既存objectの復元は保証されない。
このPRにDBのリセットや強制再アップロード、MinIOからのコピー処理は含めない。
必要な既存objectが欠ける場合は、その解消方法を決めてから本番を切り替える。

ingestは元データから消えた登録情報の削除も行うため、完全な元データ一式を使う。
存在確認で404以外のエラーが起きた場合は、そのobjectを未登録扱いして上書きしない。
dry-runはDB・objectの作成更新削除や完了通知を行わない。

## バージョンと一時chunkの保持

B2はバージョンを保持する。上書きや通常のDeleteObject後も旧バージョンが残るため、
削除APIの成功と保存容量の即時削減は同義ではない。
Web ConsoleのバケットLifecycle設定で、現在のファイルは維持し、旧バージョンは30日後に削除することを推奨する。
画像・書影の現行バージョンを日数で自動削除する設定にはしない。

`mobile-uploads/`はアプリ独自の分割upload用の通常objectであり、S3 multipart uploadではない。
完了・取消・期限切れcleanupでDeleteObjectする。期限切れchunkは次のupload開始時にcleanupされるため、uploadがない間は残る。
このprefixにも旧バージョンの削除を適用する。進行中uploadを壊さないよう、現行chunkへの短期expirationは設定しない。
S3の未完了multipartを破棄するLifecycle設定だけでは、このchunkは削除できない。

[Lifecycleの公式仕様](https://www.backblaze.com/docs/en/cloud-storage-lifecycle-rules)と
[S3 Lifecycleの対応](https://www.backblaze.com/apidocs/s3-put-lifecycle-configuration)を参照。

## 切替前の確認

専用のテストデータで画像・書影の登録、原寸・thumbnail取得、削除を確認する。
5MiB超の分割upload、再開、完了、取消、期限切れcleanupも確認する。
B2の資格情報がない状態でのローカルMinIO検証は、B2実接続の確認には代わらない。
