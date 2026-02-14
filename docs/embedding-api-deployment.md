# Embedding API VPS デプロイ手順

embedding-api サービスを ConoHa VPS (Ubuntu 24.04) に Docker でデプロイする手順書。
外部アクセスは Cloudflare Tunnels 経由のみとし、VPS のポートは一切公開しない。

## アーキテクチャ

```
Internet → Cloudflare Tunnel → cloudflared (VPS内) → embedding-api:3001
                                                    ↑ Docker内部ネットワーク
```

VPS 上では全ポートを firewall で閉じ、Cloudflare Tunnel の outbound 接続のみで外部からアクセス可能にする。

---

## Step 1: SSH 鍵の設定

> **実行環境: ローカルマシン**

```bash
# 鍵生成（Ed25519推奨）
ssh-keygen -t ed25519 -C "conoha-embedding-api" -f ~/.ssh/conoha_embedding

# 公開鍵をVPSにコピー
ssh-copy-id -i ~/.ssh/conoha_embedding.pub root@<VPS_IP>
```

### ~/.ssh/config に追記

```
Host conoha-embedding
    HostName <VPS_IP>
    User deploy
    IdentityFile ~/.ssh/conoha_embedding
    IdentitiesOnly yes
```

---

## Step 2: VPS 初期設定

> **実行環境: VPS（root で SSH）**

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

### 確認: deploy ユーザーで SSH + sudo できることを検証

**別のターミナルで**以下を実行し、root セッションはまだ閉じないこと:

```bash
ssh -i ~/.ssh/conoha_embedding deploy@<VPS_IP>
sudo whoami  # → root と表示されれば OK
```

---

## Step 3: サーバー基盤設定

> **実行環境: VPS（deploy ユーザーで SSH）**

```bash
ssh conoha-embedding
```

### 3.1 Docker・git インストール

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
ssh conoha-embedding
docker ps  # → エラーなく実行できれば OK
```

### 3.2 ファイアウォール設定（UFW）

```bash
# SSH のみ許可、他は全て拒否
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable

# 確認（3001 等のポートは開けない → Cloudflare Tunnel のみ）
sudo ufw status
```

### 3.3 fail2ban 動作確認

ConoHa VPS ではデフォルトでインストール・有効化済み。

```bash
# 動作確認
sudo fail2ban-client status sshd
```

### 3.4 自動セキュリティ更新

```bash
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3.5 Docker ログローテーション

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

### 3.6 root SSH 無効化 & パスワード認証無効化

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

## Step 4: Cloudflare Tunnel セットアップ

> **実行環境: Cloudflare Dashboard**

1. Zero Trust → Networks → Tunnels → Create a tunnel
2. Tunnel 名: `embedding-api`
3. Connector: Cloudflare に表示される `TUNNEL_TOKEN` をコピー
4. Public Hostnames:
   - Subdomain: `embedding-api` (or 任意)
   - Domain: 所有ドメイン
   - Service: `http://embedding-api:3001`
5. Access Policy (推奨): Zero Trust → Access → Applications で、このホスト名にアクセスポリシーを設定

---

## Step 5: デプロイ実行

> **実行環境: VPS（deploy ユーザーで SSH）**

### リポジトリ取得

public リポジトリのため HTTPS で認証なし clone が可能（deploy key 不要）。

```bash
git clone https://github.com/s-hirano-ist/s-private.git ~/s-private
```

compose.yaml はリポジトリ内 `services/embedding-api/compose.yaml` に含まれている。

### .env

`~/s-private/services/embedding-api/.env` に配置:

```bash
EMBEDDING_API_KEY=your-secure-api-key # ※  openssl rand -base64 32 とかで生成
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

```bash
chmod 600 ~/s-private/services/embedding-api/.env
```

### 起動

```bash
ssh conoha-embedding

cd ~/s-private/services/embedding-api

# ビルド & 起動
docker compose build
docker compose up -d

# ログ確認
docker compose logs -f

# ヘルスチェック
docker compose exec embedding-api node -e "fetch('http://localhost:3001/health').then(r=>r.json()).then(console.log)"
```

---

## Step 6: 検証

### 6.1 コンテナ状態確認（VPS）

```bash
# 両コンテナが running かつ healthy であることを確認
docker compose ps

# エラーログがないことを確認
docker compose logs --tail=50
```

### 6.2 VPS 内部からの直接検証（VPS）

Tunnel を介さず、Docker ネットワーク内で API が応答するか確認する。
この手順で失敗する場合、問題は API コンテナ自体にある。

```bash
# ヘルスチェック
docker compose exec embedding-api curl -s http://localhost:3001/health
# 期待: {"status":"ok"}

# /embed エンドポイント（Bearer 認証付き）
docker compose exec embedding-api curl -s -X POST http://localhost:3001/embed \
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "テストクエリ", "isQuery": true}'
# 期待: {"embedding": [0.123, ...]} 形式の JSON レスポンス
```

### 6.3 Cloudflare Tunnel 経由の検証（ローカル）

6.2 が成功し、以下が失敗する場合、問題は Tunnel 設定にある。

```bash
# ヘルスチェック
curl -s https://embedding-api.<domain>/health
# 期待: {"status":"ok"}

# 単一テキスト埋め込み
curl -s -X POST https://embedding-api.<domain>/embed \
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "テストクエリ", "isQuery": true}'

# バッチ埋め込み
curl -s -X POST https://embedding-api.<domain>/embed-batch \
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["テスト1", "テスト2"], "isQuery": false}'

# OpenAPI 仕様（JSON）
curl -s https://embedding-api.<domain>/doc
```

**Swagger UI:** ブラウザで `https://embedding-api.<domain>/ui` にアクセスし、API 仕様を確認する。

### 6.4 Cloudflare Access 設定時の注意

Cloudflare Access Policy を有効にしている場合、curl リクエストには **Service Token** ヘッダーが必要になる:

```bash
curl -s https://embedding-api.<domain>/health \
  -H "CF-Access-Client-Id: <client-id>" \
  -H "CF-Access-Client-Secret: <client-secret>"
```

Service Token は Cloudflare Zero Trust ダッシュボード > Access > Service Auth から発行できる。

---

## 更新手順

```bash
ssh conoha-embedding
cd ~/s-private

# 最新のコードを取得してリビルド
git pull
cd services/embedding-api
docker compose build
docker compose up -d
```

---

## トラブルシューティング

### モデルダウンロードが遅い/失敗する
初回起動時に `intfloat/multilingual-e5-small` モデル (~100MB) をダウンロードする。`hf-cache` ボリュームにキャッシュされるため、2回目以降は高速。

```bash
# キャッシュ状態を確認
docker compose exec embedding-api ls -la /home/embedding/.cache/huggingface/transformers/
```

### Cloudflare Tunnel が接続されない
```bash
# cloudflared のログを確認
docker compose logs cloudflared

# TUNNEL_TOKEN が正しいか確認
docker compose exec cloudflared env | grep TUNNEL_TOKEN
```

### メモリ不足
embedding モデルは約 200MB のメモリを使用する。VPS のメモリが 512MB 以上あることを確認。

```bash
free -h
```

### ロックアウト復旧

SSH 接続ができなくなった場合（fail2ban による ban、鍵の紛失等）の復旧手順。

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
   - SSH 設定の修正: `sudo nano /etc/ssh/sshd_config`
   - ファイアウォールの確認: `sudo ufw status`
   - サービスの再起動: `sudo systemctl restart ssh`
