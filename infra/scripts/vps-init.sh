#!/usr/bin/env bash
#
# vps-init.sh — VPS 初期セットアップスクリプト
#
# VPS 上で root として1回実行するだけで、以下を完了する:
#
# [1/6] deploy ユーザー作成 (Part 1.2)
#   - adduser --disabled-password でユーザー作成
#   - sudo グループへの追加
#   - /etc/sudoers.d/deploy で NOPASSWD sudo 設定
#   - root の authorized_keys を /home/deploy/.ssh/ にコピー
#
# [2/6] Docker + git インストール (Part 1.4.1)
#   - Docker 公式スクリプト (https://get.docker.com) でインストール
#   - systemctl enable/start docker
#   - deploy ユーザーを docker グループに追加
#   - apt install git
#
# [3/6] UFW ファイアウォール設定 (Part 1.4.2)
#   - default deny incoming / allow outgoing
#   - カスタム SSH ポートを allow (引数で指定)
#   - ポート 22 を一時的に allow (ポート変更前用)
#   - ufw enable
#
# [4/6] fail2ban 設定 (Part 1.4.3)
#   - /etc/fail2ban/jail.local にカスタム SSH ポートを設定
#   - fail2ban サービス再起動
#
# [5/6] 自動セキュリティ更新 (Part 1.4.4)
#   - unattended-upgrades パッケージのインストール
#   - /etc/apt/apt.conf.d/20auto-upgrades で日次更新を有効化
#
# [6/6] Docker ログローテーション (Part 1.4.5)
#   - /etc/docker/daemon.json に log-driver: json-file, max-size: 10m, max-file: 3 を設定
#   - Docker サービス再起動
#
# 使い方:
#   ./vps-init.sh /root/.ssh/authorized_keys 10022
#
# 除外手順（手動で実行 → vps-harden-ssh.sh）:
#   - SSH ポート変更 (Part 1.4.6)
#   - root SSH 無効化 + パスワード認証無効化 (Part 1.4.7)

set -euo pipefail

# ============================================================
# 引数チェック
# ============================================================
usage() {
    echo "Usage: $0 <SSH_PUBLIC_KEY_PATH> <SSH_PORT>"
    echo ""
    echo "Arguments:"
    echo "  SSH_PUBLIC_KEY_PATH  root の authorized_keys ファイルパス (例: /root/.ssh/authorized_keys)"
    echo "  SSH_PORT             SSH カスタムポート番号 (例: 10022)"
    echo ""
    echo "Options:"
    echo "  --help    このヘルプを表示"
    exit 1
}

if [[ "${1:-}" == "--help" ]]; then
    usage
fi

if [[ $# -ne 2 ]]; then
    echo "Error: 引数が不足しています。"
    usage
fi

SSH_PUBLIC_KEY_PATH="$1"
SSH_PORT="$2"

if [[ ! -f "$SSH_PUBLIC_KEY_PATH" ]]; then
    echo "Error: SSH 公開鍵ファイルが見つかりません: $SSH_PUBLIC_KEY_PATH"
    exit 1
fi

if ! [[ "$SSH_PORT" =~ ^[0-9]+$ ]] || [[ "$SSH_PORT" -lt 1024 ]] || [[ "$SSH_PORT" -gt 65535 ]]; then
    echo "Error: SSH ポートは 1024〜65535 の範囲で指定してください: $SSH_PORT"
    exit 1
fi

# root で実行されていることを確認
if [[ "$(id -u)" -ne 0 ]]; then
    echo "Error: このスクリプトは root として実行してください。"
    exit 1
fi

echo "============================================================"
echo " VPS 初期セットアップ開始"
echo " SSH 公開鍵: $SSH_PUBLIC_KEY_PATH"
echo " SSH ポート: $SSH_PORT"
echo "============================================================"
echo ""

# ============================================================
# Part 1.2: deploy ユーザー作成
# ============================================================
echo "[1/6] deploy ユーザーの作成..."

if id "deploy" &>/dev/null; then
    echo "  → deploy ユーザーは既に存在します。スキップ。"
else
    adduser --disabled-password --gecos "" deploy
    echo "  → deploy ユーザーを作成しました。"
fi

# sudo 権限
if groups deploy | grep -q '\bsudo\b'; then
    echo "  → deploy ユーザーは既に sudo グループに所属しています。スキップ。"
else
    usermod -aG sudo deploy
    echo "  → sudo グループに追加しました。"
fi

# パスワードなしで sudo 実行可能に（deploy ユーザーは鍵認証のみ）
if [[ -f /etc/sudoers.d/deploy ]]; then
    echo "  → sudoers.d/deploy は既に存在します。スキップ。"
else
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
    chmod 440 /etc/sudoers.d/deploy
    echo "  → パスワードなし sudo を設定しました。"
fi

# SSH 鍵のコピー
echo "  → SSH 鍵を deploy ユーザーにコピー中..."
mkdir -p /home/deploy/.ssh
cp "$SSH_PUBLIC_KEY_PATH" /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
echo "  → SSH 鍵のコピー完了。"

echo ""

# ============================================================
# Part 1.4.1: Docker + git インストール
# ============================================================
echo "[2/6] Docker と git のインストール..."

if command -v docker &>/dev/null; then
    echo "  → Docker は既にインストール済みです。スキップ。"
else
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "  → Docker をインストールしました。"
fi

# deploy ユーザーを docker グループに追加
if groups deploy | grep -q '\bdocker\b'; then
    echo "  → deploy ユーザーは既に docker グループに所属しています。スキップ。"
else
    usermod -aG docker deploy
    echo "  → deploy ユーザーを docker グループに追加しました。"
fi

if command -v git &>/dev/null; then
    echo "  → git は既にインストール済みです。スキップ。"
else
    apt-get update -qq
    apt-get install -y -qq git
    echo "  → git をインストールしました。"
fi

echo ""

# ============================================================
# Part 1.4.2: UFW ファイアウォール設定
# ============================================================
echo "[3/6] UFW ファイアウォール設定..."

if command -v ufw &>/dev/null; then
    echo "  → UFW は既にインストール済みです。"
else
    apt-get update -qq
    apt-get install -y -qq ufw
    echo "  → UFW をインストールしました。"
fi

ufw default deny incoming
ufw default allow outgoing

# カスタム SSH ポートを許可
if ufw status | grep -q "${SSH_PORT}/tcp"; then
    echo "  → ポート ${SSH_PORT}/tcp は既に許可済みです。スキップ。"
else
    ufw allow "${SSH_PORT}/tcp" comment "SSH custom port"
    echo "  → ポート ${SSH_PORT}/tcp を許可しました。"
fi

# デフォルトポート22も一時的に許可（ポート変更前のため）
if ufw status | grep -q "22/tcp"; then
    echo "  → ポート 22/tcp は既に許可済みです。スキップ。"
else
    ufw allow 22/tcp comment "SSH default port (temporary)"
    echo "  → ポート 22/tcp を一時的に許可しました（ポート変更後に削除してください）。"
fi

# UFW を有効化（既に有効な場合は何もしない）
echo "y" | ufw enable
echo "  → UFW を有効化しました。"

echo ""

# ============================================================
# Part 1.4.3: fail2ban 設定
# ============================================================
echo "[4/6] fail2ban 設定..."

if command -v fail2ban-client &>/dev/null; then
    echo "  → fail2ban は既にインストール済みです。"
else
    apt-get update -qq
    apt-get install -y -qq fail2ban
    echo "  → fail2ban をインストールしました。"
fi

cat > /etc/fail2ban/jail.local <<EOF
[sshd]
port = ${SSH_PORT}
EOF

systemctl restart fail2ban
echo "  → fail2ban を設定しました（SSH ポート: ${SSH_PORT}）。"

echo ""

# ============================================================
# Part 1.4.4: 自動セキュリティ更新
# ============================================================
echo "[5/6] 自動セキュリティ更新の設定..."

if dpkg -l | grep -q unattended-upgrades; then
    echo "  → unattended-upgrades は既にインストール済みです。スキップ。"
else
    apt-get update -qq
    apt-get install -y -qq unattended-upgrades
    echo "  → unattended-upgrades をインストールしました。"
fi

# 自動更新を有効化（非対話的に設定）
echo 'APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";' > /etc/apt/apt.conf.d/20auto-upgrades
echo "  → 自動セキュリティ更新を有効化しました。"

echo ""

# ============================================================
# Part 1.4.5: Docker ログローテーション
# ============================================================
echo "[6/6] Docker ログローテーション設定..."

DOCKER_DAEMON_JSON="/etc/docker/daemon.json"
EXPECTED_CONFIG='{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}'

if [[ -f "$DOCKER_DAEMON_JSON" ]] && echo "$EXPECTED_CONFIG" | python3 -c "
import json, sys
expected = json.load(sys.stdin)
try:
    with open('$DOCKER_DAEMON_JSON') as f:
        current = json.load(f)
    sys.exit(0 if all(current.get(k) == v for k, v in expected.items()) else 1)
except: sys.exit(1)
" 2>/dev/null; then
    echo "  → Docker ログローテーションは既に設定済みです。スキップ。"
else
    cat > "$DOCKER_DAEMON_JSON" <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
    systemctl restart docker
    echo "  → Docker ログローテーションを設定しました。"
fi

echo ""

# ============================================================
# 完了
# ============================================================
echo "============================================================"
echo " VPS 初期セットアップ完了!"
echo "============================================================"
echo ""
echo "次のステップ:"
echo "  1. 別ターミナルで deploy ユーザーの SSH + sudo を確認:"
echo "     ssh -i <秘密鍵> deploy@<VPS_IP>"
echo "     sudo whoami  # → root と表示されれば OK"
echo ""
echo "  2. deploy ユーザーに緊急用パスワードを設定（VNC コンソール用）:"
echo "     passwd deploy"
echo ""
echo "  3. SSH ハードニングスクリプトを実行（deploy ユーザーで）:"
echo "     ./vps-harden-ssh.sh ${SSH_PORT}"
echo ""
echo "  ※ ポート 22 の一時許可は vps-harden-ssh.sh 完了後に自動で削除されます。"
