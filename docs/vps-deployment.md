# VPS デプロイ手順

ConoHa VPS (Ubuntu 24.04) + Docker + Cloudflare Tunnel の汎用デプロイ手順書。
VPS 上では全ポートを firewall で閉じ、Cloudflare Tunnel の outbound 接続のみで外部からアクセス可能にする。

## アーキテクチャ

```
Internet → Cloudflare Tunnel → cloudflared (VPS内) ─┬→ embedding-api:3001
                                                    ├→ minio:9000 / minio:9001
                                                    ↑ Docker内部ネットワーク
```

---

## 自動化スクリプト

手動ステップの大部分は `infra/scripts/` のスクリプトで自動化されている。
各スクリプトの冒頭コメントに設定内容の詳細（実行されるコマンド・設定ファイルの変更内容）が記載されている。

| スクリプト | 実行環境 | 説明 |
|---|---|---|
| [`vps-init.sh`](../infra/scripts/vps-init.sh) | VPS (root) | deploy ユーザー作成、Docker/git、UFW、fail2ban、自動更新、ログローテ |
| [`vps-harden-ssh.sh`](../infra/scripts/vps-harden-ssh.sh) | VPS (deploy) | SSH ポート変更、root 無効化、パスワード認証無効化 |
| [`deploy.sh`](../infra/scripts/deploy.sh) | ローカル | リポジトリ取得、pull、デプロイ、状態確認 |

---

## デプロイフロー

### Step 1: SSH 鍵の設定（手動・ローカル）

```bash
# 鍵生成（Ed25519推奨）
ssh-keygen -t ed25519 -C "conoha-vps" -f ~/.ssh/conoha_vps

# 公開鍵をVPSにコピー（初回はデフォルトのポート22で接続）
ssh-copy-id -i ~/.ssh/conoha_vps.pub root@<VPS_IP>
```

#### ~/.ssh/config に追記

```
Host conoha-vps
    HostName <VPS_IP>
    User deploy
    Port 10022
    IdentityFile ~/.ssh/conoha_vps
    IdentitiesOnly yes
```

> **注意:** `Port 10022` は Step 4 で SSH ポートを変更した後に有効になる。初期セットアップ中（ポート変更前）は `ssh -p 22 conoha-vps` のようにポートを明示的に指定するか、一時的に `Port` 行をコメントアウトすること。

### Step 2: VPS 初期セットアップ（スクリプト・VPS root）

```bash
ssh root@<VPS_IP>
./vps-init.sh /root/.ssh/authorized_keys 10022
```

スクリプトが完了したら、以下を手動で実施:

1. **別ターミナルで** deploy ユーザーの SSH + sudo を確認:
   ```bash
   ssh -i ~/.ssh/conoha_vps deploy@<VPS_IP>
   sudo whoami  # → root と表示されれば OK
   ```
2. deploy ユーザーに緊急用パスワードを設定（VNC コンソール用）:
   ```bash
   passwd deploy
   ```

### Step 3: ConoHa セキュリティグループ設定（手動・ConoHa ダッシュボード）

> **重要:** SSH ポート変更（Step 4）の前に、新ポートをセキュリティグループで許可しておくこと。これを忘れると VPS にアクセスできなくなる。

ConoHa VPS にはVPS外部のファイアウォールとしてセキュリティグループが存在する。
デフォルトの `default` グループは全通信を許可しているため、必要なポートのみ許可するカスタムグループを作成する。

#### セキュリティグループの作成

1. ConoHa コントロールパネル → セキュリティ → セキュリティグループ → **セキュリティグループ作成**
2. グループ名: `vps-sg`
3. 以下の **Inbound ルール**を追加:

| 方向 | プロトコル | ポート | CIDR | 用途 |
| --- | --- | --- | --- | --- |
| Ingress | TCP | 10022 | 0.0.0.0/0 | SSH（カスタムポート） |

> **注意:** Cloudflare Tunnel は outbound 接続のため、Inbound ルールは SSH のみで十分。HTTP/HTTPS ポートを開ける必要はない。

#### セキュリティグループの適用

1. ConoHa コントロールパネル → サーバー → 対象 VPS → ネットワーク情報
2. セキュリティグループの設定で、デフォルトの `default` グループを削除
3. 作成した `vps-sg` を追加して保存

> **確認:** セキュリティグループ変更後、既存の SSH 接続（ポート22）が維持されていることを確認。変更は新規接続から適用される場合があるため、既存セッションは切断しないこと。初期セットアップ中はポート22での接続も必要なため、必要に応じて一時的にポート22のルールも追加しておく。

### Step 4: SSH ハードニング（スクリプト・VPS deploy）

> **注意:** 実行前に必ず別ターミナルで SSH 接続を維持すること。

```bash
ssh -p 22 conoha-vps
./vps-harden-ssh.sh 10022
```

スクリプト実行中に、別ターミナルで新ポートでの接続確認を求められる。
確認完了後、旧ポート 22 の UFW ルールが自動削除される。

> **注意:** ConoHa セキュリティグループからもポート 22 のルールを削除しておくこと（Step 3 で一時的に追加していた場合）。

### Step 5: Cloudflare Tunnel セットアップ（手動・Cloudflare Dashboard）

#### 5.1 Tunnel の作成

1. Zero Trust → Networks → Tunnels → Create a tunnel
2. Tunnel 名: `conoha-vps`
3. Connector: Cloudflare に表示される `TUNNEL_TOKEN` をコピー

#### 5.2 Service Token の発行

アプリケーション作成ウィザード内でポリシーに紐付けるため、先に Service Token を発行しておく。

1. Zero Trust → Access → Service Auth → **Create Service Token**
2. Token 名: `vps-client`
3. 発行される `CF-Access-Client-Id` と `CF-Access-Client-Secret` を安全な場所に保管
4. これらの値をアプリケーション側の環境変数 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` に設定する

#### 5.3 Cloudflare Access アプリケーション作成 + ポリシー設定

> **注意:** Cloudflare Access は **deny by default** で動作する。ポリシーなしのアプリケーションは全アクセスを拒否するため、アプリケーション作成ウィザード内でポリシーも合わせて設定すること。

1. Zero Trust → Access → Applications → **Add an application**
2. Type: **Self-hosted**
3. Application name: サービス名（例: `embedding-api`）
4. Session Duration: 任意（デフォルト 24h）
5. Application domain: Tunnel で設定したホスト名（例: `embedding-api.<domain>`）
6. ウィザード内の Policy 設定ステップで以下を追加:
   - Policy name: `Service Token Policy`
   - Action: **Service Auth**
   - Include rule: **Service Token** — 5.2 で発行した Service Token を指定

#### 5.4 Public Hostname の追加

サービスを追加する際、Tunnel に Public Hostname を追加する。

1. Zero Trust → Networks → Tunnels → `conoha-vps` → Public Hostname タブ
2. **Add a public hostname**:
   - Subdomain: サービス識別名（例: `embedding-api`, `minio`）
   - Domain: 所有ドメイン
   - Service: `http://<コンテナ名>:<ポート>`（例: `http://embedding-api:3001`）
3. 必要に応じて 5.3 と同様に Access アプリケーション + ポリシーを作成

#### 5.5 アクセス方法

CF Access により全エンドポイント（`/health`, `/doc`, `/ui` 含む）が保護される。外部からのアクセス方法は以下の2パターン。

##### 1. Service Token 経由（プログラムからのアクセス）

5.2 で発行した Service Token のヘッダーを付与してリクエストする。

```bash
# Service Token ありでアクセス → 200 OK
curl -s https://<service>.<domain>/health \
  -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET"
# 期待: {"status":"ok"}

# Service Token なしでアクセス → 302 Redirect（CF Access ログインページへ）
curl -s -o /dev/null -w "%{http_code}" https://<service>.<domain>/health
# 期待: 302
```

##### 2. ブラウザ経由（Swagger UI 等）

メール OTP ベースの Allow ポリシーを追加することでブラウザからもアクセス可能にする。

1. Zero Trust → Access → Applications → 対象アプリケーションを選択
2. 既存の Service Token ポリシー（5.3）はそのまま残す
3. 新規ポリシーを追加:
   - Policy name: `Email OTP Policy`
   - Action: **Allow**
   - Include rule: **Emails** — 自分のメールアドレスを指定
4. Identity providers に **One-time PIN** が有効であることを確認（デフォルトで有効）

設定後、`https://<service>.<domain>/ui` にアクセス → Cloudflare のログイン画面 → メール OTP 認証 → UI 表示

### Step 6: Docker Hub 認証（private image 用・手動・VPS deploy）

compose.yaml で private な Docker Hub イメージを使用するため、VPS 上で Docker Hub にログインする。

```bash
ssh conoha-vps
docker login -u <DOCKERHUB_USERNAME>
# パスワード or Access Token を入力
```

> 認証情報は `~/.docker/config.json` に保存される。Access Token の使用を推奨（Docker Hub → Account Settings → Security → New Access Token）。

### Step 7: 環境変数の準備（手動）

VPS 上の `~/s-private/.env` に配置:

```bash
# Embedding API
EMBEDDING_API_KEY=your-secure-api-key  # ※ openssl rand -base64 32 とかで生成

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token

# MinIO
MINIO_ROOT_USER=your-minio-user         # ※ デフォルトの minioadmin は使わない
MINIO_ROOT_PASSWORD=your-minio-password  # ※ openssl rand -base64 32 で生成
MINIO_BUCKET_NAME=your-bucket-name
```

```bash
chmod 600 ~/s-private/.env
```

### Step 8: デプロイ（スクリプト・ローカル）

```bash
# 初回セットアップ
./deploy.sh --init conoha-vps

# 更新
./deploy.sh --update conoha-vps

# 状態確認
./deploy.sh --status conoha-vps
```

> **注意:** 外部（Cloudflare Tunnel 経由）からの検証は Step 5.5 を参照。

---

## リファレンス

### compose.yaml 構成

リポジトリルートの `compose.yaml` に全サービスを定義している。

```
compose.yaml          ← 全サービス定義（embedding-api, minio, cloudflared）
.env                  ← VPS 用環境変数（EMBEDDING_API_KEY, CLOUDFLARE_TUNNEL_TOKEN 等）
```

全サービスは Docker Hub の image を `docker compose pull` で取得する。サービスを追加する場合は `compose.yaml` にサービス定義（`image:` 指定）を追加する。

---

## Appendix A: サービス別設定

### A.1 Embedding API

- **コンテナ名**: `embedding-api`
- **ポート**: 3001
- **ヘルスチェック**: `http://localhost:3001/health`
- **環境変数**: `EMBEDDING_API_KEY`, `PORT=3001`
- **ボリューム**: `hf-cache` — HuggingFace モデルキャッシュ（初回ダウンロード ~600MB）
- **メモリ使用量**: 約 1.1GB（multilingual-e5-large）
- **Cloudflare Public Hostname**: `embedding-api.<domain>` → `http://embedding-api:3001`

### A.2 MinIO

- **コンテナ名**: `minio`
- **ポート**: 9000 (S3 API) / 9001 (Console)
- **ヘルスチェック**: `mc ready local`
- **環境変数**: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_NAME`
- **ボリューム**: `minio-data` — オブジェクトストレージデータ
- **初期化**: `minio-init` コンテナが MinIO healthy 後にバケットを自動作成（`--ignore-existing` で冪等）

#### VPS `.env` の記載例

```bash
MINIO_ROOT_USER=your-minio-user         # ※ デフォルトの minioadmin は使わない
MINIO_ROOT_PASSWORD=your-minio-password  # ※ openssl rand -base64 32 で生成
MINIO_BUCKET_NAME=your-bucket-name
```

#### Cloudflare Public Hostname 設定

| Subdomain | Service | CF Access |
| --- | --- | --- |
| `minio.<domain>` | `http://minio:9000` | 有効（Service Token） |
| `minio-console.<domain>` | `http://minio:9001` | 有効（Email OTP） |

> **注意:** MinIO S3 API も CF Access（Service Token）で保護する。minio-js の `transport` オプションでカスタム HTTP トランスポートを設定し、CF-Access ヘッダーを注入する。ヘッダーは AWS Signature V4 の署名計算後にトランスポート層で追加されるため、S3 署名に影響しない。

#### Next.js アプリの環境変数例（本番）

```bash
MINIO_HOST=minio.<domain>
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-minio-user
MINIO_SECRET_KEY=your-minio-password
MINIO_BUCKET_NAME=your-bucket-name
```

---

## Appendix B: 運用コマンド

### B.1 旧 Qdrant コレクションの削除

Embedding モデル変更等でコレクションを移行した際、不要になった旧コレクションを削除する。

```bash
# ローカルから実行（.env に QDRANT_URL を設定済みの前提）
pnpm --filter @s-hirano-ist/s-scripts rag-delete-collection knowledge_v1
```

---

## トラブルシューティング

### Cloudflare Tunnel が接続されない

```bash
# cloudflared のログを確認
docker compose logs cloudflared

# TUNNEL_TOKEN が正しいか確認
docker compose exec cloudflared env | grep TUNNEL_TOKEN
```

### ロックアウト復旧

SSH 接続ができなくなった場合（fail2ban による ban、鍵の紛失、ポート設定ミス等）の復旧手順。

> **注意:** SSH はカスタムポート **10022** で動作している。接続時は `ssh -p 10022 deploy@<VPS_IP>` または SSH config のポート設定を確認すること。

#### fail2ban で ban された場合

VNC コンソール（ConoHa コントロールパネル）から deploy ユーザーでログインし:

```bash
# ban 状況を確認
sudo fail2ban-client status sshd

# 特定の IP を unban
sudo fail2ban-client set sshd unbanip <YOUR_IP>
```

#### VNC コンソールからの復旧手順

1. ConoHa コントロールパネル → サーバー → 対象VPS → コンソール を開く
2. deploy ユーザーと Step 2 で設定した緊急用パスワードでログイン
3. 必要に応じて以下を実行:
   - fail2ban の unban（上記参照）
   - SSH 設定の修正: `sudo nano /etc/ssh/sshd_config`（ポートが `Port 10022` になっていることを確認）
   - ファイアウォールの確認: `sudo ufw status`（10022/tcp が ALLOW になっていることを確認）
   - ConoHa セキュリティグループの確認: コントロールパネルでポート 10022 の Inbound ルールが存在することを確認
   - サービスの再起動: `sudo systemctl restart ssh`
