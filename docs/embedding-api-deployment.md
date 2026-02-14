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

### ローカルマシンで

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

### VPS 側で

```bash
# deploy ユーザー作成
adduser --disabled-password deploy
usermod -aG docker deploy

# SSH鍵設定
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# root SSH ログイン無効化 & パスワード認証無効化
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

---

## Step 2: ファイアウォール設定（UFW）

```bash
# SSH のみ許可、他は全て拒否
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw enable

# 確認（3001 等のポートは開けない → Cloudflare Tunnel のみ）
ufw status
```

---

## Step 3: Docker インストール

```bash
# Docker 公式リポジトリからインストール
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# deploy ユーザーを docker グループに追加（再ログイン必要）
usermod -aG docker deploy
```

---

## Step 4: Cloudflare Tunnel セットアップ

### Cloudflare Dashboard で

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
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
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
# deploy ユーザーで SSH
ssh conoha-embedding

# 作業ディレクトリ
mkdir -p ~/embedding-api && cd ~/embedding-api

# compose.yaml と .env を配置後
docker compose up -d

# ログ確認
docker compose logs -f

# ヘルスチェック
docker compose exec embedding-api curl -s http://localhost:3001/health
```

---

## Step 6: 検証

1. **ヘルスチェック:** Cloudflare Tunnel 経由で `https://embedding-api.<domain>/health` にアクセスし `{"status":"ok"}` を確認
2. **機能テスト:**
   ```bash
   curl -X POST https://embedding-api.<domain>/embed \
     -H "Authorization: Bearer $EMBEDDING_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"text": "テストクエリ", "isQuery": true}'
   ```
3. **Swagger UI:** `https://embedding-api.<domain>/ui` でAPI仕様を確認

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
