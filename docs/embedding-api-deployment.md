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
ssh -i ~/.ssh/conoha_embedding deploy@<VPS_IP>
```

### 3.1 Swap 設定

メモリが少ない VPS（512MB〜1GB）では swap を設定する:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 確認
free -h
```

### 3.2 Docker インストール

```bash
# Docker 公式リポジトリからインストール
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable docker
sudo systemctl start docker

# deploy ユーザーを docker グループに追加（再ログイン必要）
sudo usermod -aG docker deploy
```

再ログインして `docker ps` が実行できることを確認:

```bash
exit
ssh -i ~/.ssh/conoha_embedding deploy@<VPS_IP>
docker ps  # → エラーなく実行できれば OK
```

### 3.3 ファイアウォール設定（UFW）

```bash
# SSH のみ許可、他は全て拒否
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable

# 確認（3001 等のポートは開けない → Cloudflare Tunnel のみ）
sudo ufw status
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
sudo systemctl restart sshd
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

### compose.yaml

VPS の `~/embedding-api/compose.yaml` に配置:

```yaml
services:
  embedding-api:
    image: ${DOCKER_HUB_USERNAME}/s-embedding-api:latest
    container_name: embedding-api
    restart: unless-stopped
    environment:
      - API_KEY=${EMBEDDING_API_KEY}
      - PORT=3001
    volumes:
      - hf-cache:/home/embedding/.cache/huggingface/transformers
    networks:
      - tunnel-net
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 3s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    networks:
      - tunnel-net
    depends_on:
      embedding-api:
        condition: service_healthy

volumes:
  hf-cache:

networks:
  tunnel-net:
    driver: bridge
```

### .env

VPS の `~/embedding-api/.env` に配置:

```bash
DOCKER_HUB_USERNAME=your-dockerhub-username
EMBEDDING_API_KEY=your-secure-api-key
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

```bash
chmod 600 .env
```

### 起動

```bash
ssh conoha-embedding

# 作業ディレクトリ
mkdir -p ~/embedding-api && cd ~/embedding-api

# compose.yaml と .env を配置後
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

CD パイプライン（`.github/workflows/cd.yaml`）が `autorelease` ラベル付き PR で Docker Hub にイメージを push する。
VPS 側での更新:

```bash
ssh conoha-embedding
cd ~/embedding-api
docker compose pull
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
swap が設定されているか確認:

```bash
free -h
swapon --show
```

swap が未設定の場合は Step 3.1 を参照。
