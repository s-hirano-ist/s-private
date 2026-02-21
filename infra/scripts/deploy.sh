#!/usr/bin/env bash
#
# deploy.sh — リモートデプロイスクリプト
#
# ローカルマシンから実行。SSH 経由で VPS 上の Docker Compose サービスを管理する。
#
# --init (初回セットアップ):
#   - git clone でリポジトリを ~/s-private に取得
#   - .env ファイルの作成ガイド表示 (CLOUDFLARE_TUNNEL_TOKEN 等)
#   - docker compose --profile vps pull → up -d
#
# --update (コード更新 & 再デプロイ):
#   - git pull で最新コード取得
#   - docker compose --profile vps pull → up -d
#
# --status (状態確認):
#   - docker compose --profile vps ps でサービス一覧
#   - docker compose --profile vps logs --tail=20 で最新ログ
#   - embedding-api の /health エンドポイントでヘルスチェック
#
# 使い方:
#   ./deploy.sh --init   <SSH_HOST>
#   ./deploy.sh --update <SSH_HOST>
#   ./deploy.sh --status <SSH_HOST>
#
# SSH_HOST は ~/.ssh/config の Host 名（例: conoha-vps）

set -euo pipefail

REPO_URL="https://github.com/s-hirano-ist/s-private.git"
REMOTE_DIR="~/s-private"

# ============================================================
# 引数チェック
# ============================================================
usage() {
    echo "Usage: $0 <MODE> <SSH_HOST>"
    echo ""
    echo "Modes:"
    echo "  --init     初回セットアップ (git clone, .env ガイド, pull, up)"
    echo "  --update   更新 (git pull, pull, up -d)"
    echo "  --status   状態確認 (ps, logs, health check)"
    echo ""
    echo "Arguments:"
    echo "  SSH_HOST   SSH config の Host 名 (例: conoha-vps)"
    echo ""
    echo "Options:"
    echo "  --help     このヘルプを表示"
    echo ""
    echo "Examples:"
    echo "  $0 --init conoha-vps"
    echo "  $0 --update conoha-vps"
    echo "  $0 --status conoha-vps"
    exit 1
}

if [[ "${1:-}" == "--help" ]]; then
    usage
fi

if [[ $# -ne 2 ]]; then
    echo "Error: 引数が不足しています。"
    usage
fi

MODE="$1"
SSH_HOST="$2"

# SSH 接続テスト
ssh_exec() {
    ssh "$SSH_HOST" "$@"
}

test_ssh() {
    echo "SSH 接続テスト中..."
    if ! ssh_exec "echo ok" &>/dev/null; then
        echo "Error: SSH 接続に失敗しました: $SSH_HOST"
        echo "~/.ssh/config の設定を確認してください。"
        exit 1
    fi
    echo "  → SSH 接続 OK。"
    echo ""
}

# ============================================================
# --init: 初回セットアップ
# ============================================================
do_init() {
    echo "============================================================"
    echo " 初回セットアップ: ${SSH_HOST}"
    echo "============================================================"
    echo ""

    test_ssh

    # リポジトリの存在確認
    if ssh_exec "test -d ${REMOTE_DIR}/.git"; then
        echo "Warning: ${REMOTE_DIR} は既に存在します。"
        read -rp "--update を使用しますか? (y/N): " USE_UPDATE
        if [[ "${USE_UPDATE}" == "y" || "${USE_UPDATE}" == "Y" ]]; then
            do_update
            return
        fi
        echo "中断しました。"
        exit 0
    fi

    echo "[1/4] リポジトリをクローン中..."
    ssh_exec "git clone ${REPO_URL} ${REMOTE_DIR}"
    echo "  → クローン完了。"
    echo ""

    echo "[2/4] 環境変数ファイルの設定..."
    if ssh_exec "test -f ${REMOTE_DIR}/.env"; then
        echo "  → .env は既に存在します。スキップ。"
    else
        echo "  → ${REMOTE_DIR}/.env を作成してください。"
        echo ""
        echo "  必要な環境変数:"
        echo "    EMBEDDING_MODEL=intfloat/multilingual-e5-large  # TEI用モデルID（必須）"
        echo "    EMBEDDING_VECTOR_SIZE=1024                       # ベクトル次元数（必須）"
        echo "    EMBEDDING_QUERY_PREFIX=query:                    # クエリプレフィックス（必須）"
        echo "    EMBEDDING_PASSAGE_PREFIX=passage:                # パッセージプレフィックス（必須）"
        echo "    QDRANT_COLLECTION_NAME=knowledge_v2              # コレクション名（必須）"
        echo "    CLOUDFLARE_TUNNEL_TOKEN=<Cloudflare Dashboard から取得>"
        echo "    MINIO_ROOT_USER=<任意のユーザー名>"
        echo "    MINIO_ROOT_PASSWORD=<openssl rand -base64 32 で生成>"
        echo "    MINIO_BUCKET_NAME=<バケット名>"
        echo ""
        read -rp ".env を作成しましたか? (y/N): " ENV_CREATED
        if [[ "${ENV_CREATED}" != "y" && "${ENV_CREATED}" != "Y" ]]; then
            echo ""
            echo ".env 作成後に再度 --init を実行してください。"
            exit 0
        fi
        ssh_exec "chmod 600 ${REMOTE_DIR}/.env"
    fi
    echo ""

    echo "[3/4] Docker イメージを pull 中..."
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps pull"
    echo "  → pull 完了。"
    echo ""

    echo "[4/4] サービスを起動中..."
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps up -d"
    echo "  → 起動完了。"
    echo ""

    echo "============================================================"
    echo " 初回セットアップ完了!"
    echo "============================================================"
    echo ""
    echo "状態確認: $0 --status ${SSH_HOST}"
}

# ============================================================
# --update: 更新
# ============================================================
do_update() {
    echo "============================================================"
    echo " コード更新 & 再デプロイ: ${SSH_HOST}"
    echo "============================================================"
    echo ""

    test_ssh

    if ! ssh_exec "test -d ${REMOTE_DIR}/.git"; then
        echo "Error: ${REMOTE_DIR} が見つかりません。先に --init を実行してください。"
        exit 1
    fi

    echo "[1/3] 最新コードを取得中..."
    ssh_exec "cd ${REMOTE_DIR} && git pull"
    echo "  → pull 完了。"
    echo ""

    echo "[2/3] Docker イメージを pull 中..."
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps pull"
    echo "  → pull 完了。"
    echo ""

    echo "[3/3] サービスを再起動中..."
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps up -d"
    echo "  → 再起動完了。"
    echo ""

    echo "============================================================"
    echo " 更新完了!"
    echo "============================================================"
    echo ""
    echo "状態確認: $0 --status ${SSH_HOST}"
}

# ============================================================
# --status: 状態確認
# ============================================================
do_status() {
    echo "============================================================"
    echo " 状態確認: ${SSH_HOST}"
    echo "============================================================"
    echo ""

    test_ssh

    if ! ssh_exec "test -d ${REMOTE_DIR}/.git"; then
        echo "Error: ${REMOTE_DIR} が見つかりません。先に --init を実行してください。"
        exit 1
    fi

    echo "[1/3] Docker Compose サービス状態:"
    echo "------------------------------------------------------------"
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps ps"
    echo ""

    echo "[2/3] 最新ログ (各サービス末尾20行):"
    echo "------------------------------------------------------------"
    ssh_exec "cd ${REMOTE_DIR} && docker compose --profile vps logs --tail=20"
    echo ""

    echo "[3/3] ヘルスチェック:"
    echo "------------------------------------------------------------"

    # embedding-api ヘルスチェック
    echo -n "  embedding-api: "
    if ssh_exec "docker compose -f ${REMOTE_DIR}/compose.yaml exec -T embedding-api curl -sf http://localhost:3001/health" 2>/dev/null; then
        echo "  → OK"
    else
        echo "  → FAIL (コンテナが起動していないか、ヘルスチェックに失敗)"
    fi

    echo ""
    echo "============================================================"
}

# ============================================================
# メイン
# ============================================================
case "$MODE" in
    --init)
        do_init
        ;;
    --update)
        do_update
        ;;
    --status)
        do_status
        ;;
    *)
        echo "Error: 不明なモード: $MODE"
        usage
        ;;
esac
