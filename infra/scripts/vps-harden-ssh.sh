#!/usr/bin/env bash
#
# vps-harden-ssh.sh — SSH ハードニングスクリプト
#
# VPS 上で deploy ユーザーとして実行。以下を行う:
#
# [1/4] SSH ポート変更 (Part 1.4.6)
#   - /etc/ssh/sshd_config の Port を引数のポートに変更
#
# [2/4] root ログイン無効化 (Part 1.4.7)
#   - /etc/ssh/sshd_config: PermitRootLogin no
#
# [3/4] パスワード認証無効化 (Part 1.4.7)
#   - /etc/ssh/sshd_config: PasswordAuthentication no
#   - sshd -t で文法チェック → systemctl restart ssh
#
# [4/4] 旧ポート 22 の UFW ルール削除
#   - ufw delete allow 22/tcp
#
# 使い方:
#   ./vps-harden-ssh.sh 10022
#
# 注意:
#   実行前に必ず別ターミナルで SSH 接続を維持してください。
#   設定ミスでロックアウトされた場合、VNC コンソールから復旧できます。

set -euo pipefail

# ============================================================
# 引数チェック
# ============================================================
usage() {
    echo "Usage: $0 <SSH_PORT>"
    echo ""
    echo "Arguments:"
    echo "  SSH_PORT  SSH カスタムポート番号 (例: 10022)"
    echo ""
    echo "Options:"
    echo "  --help    このヘルプを表示"
    exit 1
}

if [[ "${1:-}" == "--help" ]]; then
    usage
fi

if [[ $# -ne 1 ]]; then
    echo "Error: 引数が不足しています。"
    usage
fi

SSH_PORT="$1"

if ! [[ "$SSH_PORT" =~ ^[0-9]+$ ]] || [[ "$SSH_PORT" -lt 1024 ]] || [[ "$SSH_PORT" -gt 65535 ]]; then
    echo "Error: SSH ポートは 1024〜65535 の範囲で指定してください: $SSH_PORT"
    exit 1
fi

# sudo が使えることを確認
if ! sudo -n true 2>/dev/null; then
    echo "Error: sudo 権限が必要です。deploy ユーザーで実行してください。"
    exit 1
fi

# ============================================================
# 警告と確認
# ============================================================
echo "============================================================"
echo " SSH ハードニング"
echo "============================================================"
echo ""
echo "このスクリプトは以下の変更を行います:"
echo "  1. SSH ポートを ${SSH_PORT} に変更"
echo "  2. root ログインを無効化"
echo "  3. パスワード認証を無効化"
echo "  4. 旧ポート 22 の UFW ルールを削除"
echo ""
echo "============================================"
echo " 警告: 別ターミナルで SSH 接続を維持してください!"
echo " ロックアウト時は VNC コンソールから復旧できます。"
echo "============================================"
echo ""
read -rp "続行しますか? (y/N): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
    echo "中断しました。"
    exit 0
fi

echo ""

# ============================================================
# Step 1: SSH ポート変更
# ============================================================
echo "[1/4] SSH ポートを ${SSH_PORT} に変更..."

SSHD_CONFIG="/etc/ssh/sshd_config"

# 現在のポート設定を確認
CURRENT_PORT=$(grep -E "^#?Port " "$SSHD_CONFIG" | tail -1 | awk '{print $2}')
if [[ "$CURRENT_PORT" == "$SSH_PORT" ]]; then
    echo "  → SSH ポートは既に ${SSH_PORT} に設定済みです。スキップ。"
else
    sudo sed -i "s/^#*Port .*/Port ${SSH_PORT}/" "$SSHD_CONFIG"
    echo "  → SSH ポートを ${SSH_PORT} に変更しました。"
fi

echo ""

# ============================================================
# Step 2: root ログイン無効化
# ============================================================
echo "[2/4] root ログインを無効化..."

if grep -qE "^PermitRootLogin no" "$SSHD_CONFIG"; then
    echo "  → root ログインは既に無効化されています。スキップ。"
else
    sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONFIG"
    echo "  → root ログインを無効化しました。"
fi

echo ""

# ============================================================
# Step 3: パスワード認証無効化
# ============================================================
echo "[3/4] パスワード認証を無効化..."

if grep -qE "^PasswordAuthentication no" "$SSHD_CONFIG"; then
    echo "  → パスワード認証は既に無効化されています。スキップ。"
else
    sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
    echo "  → パスワード認証を無効化しました。"
fi

echo ""

# ============================================================
# sshd 文法チェック + 再起動
# ============================================================
echo "[3.5] sshd 設定の文法チェック..."

if sudo sshd -t; then
    echo "  → 文法チェック OK。"
else
    echo "Error: sshd_config に文法エラーがあります。変更を確認してください。"
    exit 1
fi

echo "  → SSH サービスを再起動中..."
sudo systemctl restart ssh
echo "  → SSH サービスを再起動しました。"

echo ""
echo "============================================"
echo " 重要: このターミナルは閉じないでください!"
echo " 別ターミナルで新ポートでの接続を確認:"
echo "   ssh -p ${SSH_PORT} deploy@<VPS_IP>"
echo "   sudo whoami  # → root と表示されれば OK"
echo "============================================"
echo ""
read -rp "新ポートでの接続確認が取れましたか? (y/N): " CONFIRM_PORT
if [[ "${CONFIRM_PORT}" != "y" && "${CONFIRM_PORT}" != "Y" ]]; then
    echo ""
    echo "旧ポートの UFW ルール削除をスキップしました。"
    echo "接続確認後、手動で以下を実行してください:"
    echo "  sudo ufw delete allow 22/tcp"
    exit 0
fi

# ============================================================
# Step 4: 旧ポート 22 の UFW ルール削除
# ============================================================
echo ""
echo "[4/4] 旧ポート 22 の UFW ルールを削除..."

if sudo ufw status | grep -q "22/tcp"; then
    sudo ufw delete allow 22/tcp
    echo "  → ポート 22/tcp のルールを削除しました。"
else
    echo "  → ポート 22/tcp のルールは存在しません。スキップ。"
fi

echo ""

# ============================================================
# 完了
# ============================================================
echo "============================================================"
echo " SSH ハードニング完了!"
echo "============================================================"
echo ""
echo "適用された設定:"
echo "  - SSH ポート: ${SSH_PORT}"
echo "  - root ログイン: 無効"
echo "  - パスワード認証: 無効"
echo "  - UFW ポート 22: 削除済み"
echo ""
echo "注意:"
echo "  - ConoHa セキュリティグループからもポート 22 のルールを削除してください"
echo "  - SSH config の Port を ${SSH_PORT} に更新してください"
