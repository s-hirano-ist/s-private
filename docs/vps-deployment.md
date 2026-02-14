# VPS デプロイ手順

ConoHa VPS (Ubuntu 24.04) + Docker + Cloudflare Tunnel の汎用デプロイ手順書。
VPS 上では全ポートを firewall で閉じ、Cloudflare Tunnel の outbound 接続のみで外部からアクセス可能にする。

## アーキテクチャ

```
Internet → Cloudflare Tunnel → cloudflared (VPS内) ─┬→ embedding-api:3001
                                                    ├→ minio:9000 (予定)
                                                    ├→ qdrant:6333 (予定)
                                                    └→ ...
                                                    ↑ Docker内部ネットワーク
```

---

## Part 1: VPS 初期セットアップ（一度だけ実行）

### 1.1 SSH 鍵の設定

> **実行環境: ローカルマシン**

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

> **注意:** `Port 10022` は 1.4.6 でSSHポートを変更した後に有効になる。初期セットアップ中（ポート変更前）は `ssh -p 22 conoha-vps` のようにポートを明示的に指定するか、一時的に `Port` 行をコメントアウトすること。

### 1.2 VPS 初期設定

> **実行環境: VPS（root で SSH）**
> **注意:** この時点ではまだ SSH ポートはデフォルト（22）。ポート変更は 1.4.6 で行う。

```bash
ssh root@<VPS_IP>
```

```bash
# deploy ユーザー作成
adduser --disabled-password deploy

# sudo 権限を付与
usermod -aG sudo deploy

# SSH鍵を deploy ユーザーにコピー
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# deploy ユーザーに緊急用パスワードを設定（VNCコンソール用）
# --disabled-password のままだと VNC コンソールからログインできない
passwd deploy
# → 設定したパスワードは安全な場所に保管すること
```

#### 確認: deploy ユーザーで SSH + sudo できることを検証

**別のターミナルで**以下を実行し、root セッションはまだ閉じないこと:

```bash
# 初期セットアップ中はポート22（デフォルト）で接続
ssh -i ~/.ssh/conoha_vps deploy@<VPS_IP>
sudo whoami  # → root と表示されれば OK
```

### 1.3 ConoHa セキュリティグループ設定

> **実行環境: ConoHa コントロールパネル**
> **重要:** SSH ポート変更（1.4.6）の前に、新ポートをセキュリティグループで許可しておくこと。これを忘れると VPS にアクセスできなくなる。

ConoHa VPS にはVPS外部のファイアウォールとしてセキュリティグループが存在する。
デフォルトの `default` グループは全通信を許可しているため、必要なポートのみ許可するカスタムグループを作成する。

#### 1.3.1 セキュリティグループの作成

1. ConoHa コントロールパネル → セキュリティ → セキュリティグループ → **セキュリティグループ作成**
2. グループ名: `vps-sg`
3. 以下の **Inbound ルール**を追加:

| 方向 | プロトコル | ポート | CIDR | 用途 |
| --- | --- | --- | --- | --- |
| Ingress | TCP | 10022 | 0.0.0.0/0 | SSH（カスタムポート） |

> **注意:** Cloudflare Tunnel は outbound 接続のため、Inbound ルールは SSH のみで十分。HTTP/HTTPS ポートを開ける必要はない。

#### 1.3.2 セキュリティグループの適用

1. ConoHa コントロールパネル → サーバー → 対象 VPS → ネットワーク情報
2. セキュリティグループの設定で、デフォルトの `default` グループを削除
3. 作成した `vps-sg` を追加して保存

> **確認:** セキュリティグループ変更後、既存の SSH 接続（ポート22）が維持されていることを確認。変更は新規接続から適用される場合があるため、既存セッションは切断しないこと。初期セットアップ中はポート22での接続も必要なため、必要に応じて一時的にポート22のルールも追加しておく。

### 1.4 サーバー基盤設定

> **実行環境: VPS（deploy ユーザーで SSH）**
> **注意:** 1.1 の SSH config で `Port 10022` を設定済みの場合、ポート変更が完了するまでは `ssh -p 22 conoha-vps` で接続すること。

```bash
ssh -p 22 conoha-vps
```

#### 1.4.1 Docker・git インストール

```bash
# Docker 公式リポジトリからインストール
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable docker
sudo systemctl start docker

# deploy ユーザーを docker グループに追加（再ログイン必要）
sudo usermod -aG docker deploy

# git インストール
sudo apt install -y git
```

再ログインして `docker ps` が実行できることを確認:

```bash
exit
ssh -p 22 conoha-vps  # ポート変更前のため明示的にポート22を指定
docker ps  # → エラーなく実行できれば OK
```

#### 1.4.2 ファイアウォール設定（UFW）

```bash
# SSH カスタムポートのみ許可、他は全て拒否
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 10022/tcp comment 'SSH custom port'
sudo ufw enable

# 確認（3001 等のポートは開けない → Cloudflare Tunnel のみ）
sudo ufw status
```

> **注意:** ポート変更（1.4.6）が完了するまでは、デフォルトポート22でも接続できるよう `sudo ufw allow ssh` も一時的に追加しておくこと。ポート変更完了後に `sudo ufw delete allow ssh` で旧ポートを閉じる（1.4.6 参照）。

#### 1.4.3 fail2ban 設定

ConoHa VPS ではデフォルトでインストール・有効化済み。
カスタムポートを認識するよう設定を追加する。

```bash
# カスタムポート用の jail 設定
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[sshd]
port = 10022
EOF

sudo systemctl restart fail2ban

# 動作確認
sudo fail2ban-client status sshd
```

#### 1.4.4 自動セキュリティ更新

```bash
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 1.4.5 Docker ログローテーション

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

#### 1.4.6 SSH ポート変更

> **重要: ロックアウト防止のため、以下の順序を厳守すること。**
> 1. ConoHa セキュリティグループでポート 10022 を許可済みであること（1.3）
> 2. UFW でポート 10022 を許可済みであること（1.4.2）

```bash
# sshd_config のポートを変更
sudo sed -i 's/^#*Port .*/Port 10022/' /etc/ssh/sshd_config

# 文法チェック（エラーがあればここで止まる）
sudo sshd -t

# SSH サービスを再起動
sudo systemctl restart ssh

# !! このターミナルは絶対に閉じないこと !!
```

**別のターミナルで**新ポートでの接続を確認:

```bash
ssh conoha-vps
# Port 10022 が config に設定済みなので、そのまま接続できるはず
sudo whoami  # → root と表示されれば OK
```

接続確認が取れたら、旧ポート 22 を閉じる:

```bash
# UFW から旧ポートを削除
sudo ufw delete allow ssh

# 確認
sudo ufw status
```

> **注意:** ConoHa セキュリティグループからもポート 22 のルールを削除しておくこと（1.3 で一時的に追加していた場合）。

#### 1.4.7 root SSH 無効化 & パスワード認証無効化

> **重要: これは全てのセットアップが完了した後に実行すること。**
> 実行前に、別ターミナルで deploy ユーザーの SSH + sudo が動作することを再度確認すること。

```bash
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

# 文法チェック（エラーがあればここで止まる）
sudo sshd -t

sudo systemctl restart ssh

# !! このターミナルは閉じずに、別ターミナルで接続確認 !!
```

---

## Part 2: Cloudflare Tunnel セットアップ（一度だけ実行）

### 2.1 Tunnel の作成

> **実行環境: Cloudflare Dashboard**

1. Zero Trust → Networks → Tunnels → Create a tunnel
2. Tunnel 名: `conoha-vps`
3. Connector: Cloudflare に表示される `TUNNEL_TOKEN` をコピー

### 2.2 Service Token の発行

アプリケーション作成ウィザード内でポリシーに紐付けるため、先に Service Token を発行しておく。

1. Zero Trust → Access → Service Auth → **Create Service Token**
2. Token 名: `vps-client`
3. 発行される `CF-Access-Client-Id` と `CF-Access-Client-Secret` を安全な場所に保管
4. これらの値をアプリケーション側の環境変数 `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` に設定する

### 2.3 Cloudflare Access アプリケーション作成 + ポリシー設定

> **注意:** Cloudflare Access は **deny by default** で動作する。ポリシーなしのアプリケーションは全アクセスを拒否するため、アプリケーション作成ウィザード内でポリシーも合わせて設定すること。

1. Zero Trust → Access → Applications → **Add an application**
2. Type: **Self-hosted**
3. Application name: サービス名（例: `embedding-api`）
4. Session Duration: 任意（デフォルト 24h）
5. Application domain: Tunnel で設定したホスト名（例: `embedding-api.<domain>`）
6. ウィザード内の Policy 設定ステップで以下を追加:
   - Policy name: `Service Token Policy`
   - Action: **Service Auth**
   - Include rule: **Service Token** — 2.2 で発行した Service Token を指定

### 2.4 Public Hostname の追加

サービスを追加する際、Tunnel に Public Hostname を追加する。

1. Zero Trust → Networks → Tunnels → `conoha-vps` → Public Hostname タブ
2. **Add a public hostname**:
   - Subdomain: サービス識別名（例: `embedding-api`, `minio`, `qdrant`）
   - Domain: 所有ドメイン
   - Service: `http://<コンテナ名>:<ポート>`（例: `http://embedding-api:3001`）
3. 必要に応じて 2.3 と同様に Access アプリケーション + ポリシーを作成

### 2.5 アクセス方法

CF Access により全エンドポイント（`/health`, `/doc`, `/ui` 含む）が保護される。外部からのアクセス方法は以下の2パターン。

#### 1. Service Token 経由（プログラムからのアクセス）

2.2 で発行した Service Token のヘッダーを付与してリクエストする。

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

#### 2. ブラウザ経由（Swagger UI 等）

メール OTP ベースの Allow ポリシーを追加することでブラウザからもアクセス可能にする。

1. Zero Trust → Access → Applications → 対象アプリケーションを選択
2. 既存の Service Token ポリシー（2.3）はそのまま残す
3. 新規ポリシーを追加:
   - Policy name: `Email OTP Policy`
   - Action: **Allow**
   - Include rule: **Emails** — 自分のメールアドレスを指定
4. Identity providers に **One-time PIN** が有効であることを確認（デフォルトで有効）

設定後、`https://<service>.<domain>/ui` にアクセス → Cloudflare のログイン画面 → メール OTP 認証 → UI 表示

---

## Part 3: サービスのデプロイ

### 3.1 リポジトリ取得

> **実行環境: VPS（deploy ユーザーで SSH）**

public リポジトリのため HTTPS で認証なし clone が可能（deploy key 不要）。

```bash
git clone https://github.com/s-hirano-ist/s-private.git ~/s-private
```

### 3.2 compose.yaml 構成

リポジトリルートの `compose.yaml` に全サービスを定義している。

```
compose.yaml          ← 全サービス定義（embedding-api, cloudflared, 将来: minio, qdrant）
.env                  ← VPS 用環境変数（EMBEDDING_API_KEY, CLOUDFLARE_TUNNEL_TOKEN 等）
services/
  embedding-api/
    Dockerfile        ← embedding-api のビルド定義
    src/              ← ソースコード
```

サービスを追加する場合は `compose.yaml` にサービス定義を追加し、必要に応じて Dockerfile を配置する。

### 3.3 環境変数の設定

`~/s-private/.env` に配置:

```bash
# Embedding API
EMBEDDING_API_KEY=your-secure-api-key  # ※ openssl rand -base64 32 とかで生成

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token

# 将来追加:
# MINIO_ROOT_USER=...
# MINIO_ROOT_PASSWORD=...
# QDRANT_API_KEY=...
```

```bash
chmod 600 ~/s-private/.env
```

### 3.4 起動・更新・検証

#### 初回起動

```bash
ssh conoha-vps
cd ~/s-private

# ビルド & 起動
docker compose build
docker compose up -d
```

#### 更新

```bash
ssh conoha-vps
cd ~/s-private

# 最新のコードを取得してリビルド
git pull
docker compose build
docker compose up -d
```

#### 検証

```bash
# 両コンテナが running かつ healthy であることを確認
docker compose ps

# エラーログがないことを確認
docker compose logs --tail=50
```

VPS 内部からの直接検証（Tunnel を介さず Docker ネットワーク内で API が応答するか確認）:

```bash
docker compose exec embedding-api node -e "fetch('http://localhost:3001/health').then(r=>r.text()).then(console.log)"
# 期待: {"status":"ok"}
```

> **注意:** 外部（Cloudflare Tunnel 経由）からの検証は Part 2.5 を参照。

---

## Appendix A: サービス別設定

### A.1 Embedding API

- **コンテナ名**: `embedding-api`
- **ポート**: 3001
- **ヘルスチェック**: `http://localhost:3001/health`
- **環境変数**: `EMBEDDING_API_KEY`, `PORT=3001`
- **ボリューム**: `hf-cache` — HuggingFace モデルキャッシュ（初回ダウンロード ~100MB）
- **メモリ使用量**: 約 200MB（multilingual-e5-small）
- **Cloudflare Public Hostname**: `embedding-api.<domain>` → `http://embedding-api:3001`

### A.2 MinIO（予定）

<!-- TODO: MinIO サービス追加時に記載 -->

### A.3 Qdrant（予定）

<!-- TODO: Qdrant サービス追加時に記載 -->

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
2. deploy ユーザーと Part 1.2 で設定した緊急用パスワードでログイン
3. 必要に応じて以下を実行:
   - fail2ban の unban（上記参照）
   - SSH 設定の修正: `sudo nano /etc/ssh/sshd_config`（ポートが `Port 10022` になっていることを確認）
   - ファイアウォールの確認: `sudo ufw status`（10022/tcp が ALLOW になっていることを確認）
   - ConoHa セキュリティグループの確認: コントロールパネルでポート 10022 の Inbound ルールが存在することを確認
   - サービスの再起動: `sudo systemctl restart ssh`
