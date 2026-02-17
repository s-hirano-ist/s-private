# ConoHa VPS Terraform

Terraform で ConoHa VPS のプロビジョニングを自動化する。
`terraform apply` 1回で、VPS 作成 + セキュリティ設定 + Docker インストールまで完了する。

## 前提条件

### 1. Terraform インストール

[tfenv](https://github.com/tfutils/tfenv) の使用を推奨:

```bash
# tfenv インストール（macOS）
brew install tfenv

# Terraform インストール
tfenv install 1.5.0
tfenv use 1.5.0

# 確認
terraform version
```

### 2. ConoHa API 認証情報の取得

[ConoHa コントロールパネル](https://manage.conoha.jp) > API > API情報 から取得し、環境変数に設定:

```bash
export OS_AUTH_URL="https://identity.tyo3.conoha.io/v3"
export OS_USERNAME="gncu..."
export OS_PASSWORD="your-api-password"
export OS_TENANT_ID="your-tenant-id"
export OS_USER_DOMAIN_NAME="Default"
export OS_PROJECT_DOMAIN_NAME="Default"
```

> `.bashrc` や `.zshrc` に追加するか、[direnv](https://direnv.net/) の `.envrc` に設定すると便利。

### 3. SSH 鍵の生成

```bash
ssh-keygen -t ed25519 -C "deploy@conoha" -f ~/.ssh/conoha_deploy
```

## クイックスタート

```bash
cd infra/terraform

# 1. 変数ファイルを作成
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集し、ssh_public_key に公開鍵の内容を設定
# 例: ssh_public_key = "ssh-ed25519 AAAA... deploy@conoha"

# 2. 初期化（プロバイダーのダウンロード）
terraform init

# 3. 実行計画の確認（実際のリソース作成はまだ行われない）
terraform plan

# 4. 適用（VPS 作成）
terraform apply
# "yes" と入力して確定

# 5. cloud-init 完了の確認（IP は output で表示される）
ssh -p 10022 deploy@<VPS_IP> "cloud-init status --wait"
# status: done と表示されれば完了
```

## 適用後の手動ステップ

cloud-init が完了した後、以下を手動で実施する。

### 1. deploy ユーザーにパスワードを設定

VNC コンソールからの緊急アクセス用:

```bash
ssh -p 10022 deploy@<VPS_IP>
sudo passwd deploy
```

### 2. SSH ハードニング

SSH ポート変更 + root ログイン無効化 + パスワード認証無効化を行う。
**ロックアウト防止のため、別ターミナルで SSH 接続を維持した状態で実行すること。**

```bash
# VPS に接続
ssh -p 10022 deploy@<VPS_IP>

# スクリプトを転送して実行
scp -P 10022 infra/scripts/vps-harden-ssh.sh deploy@<VPS_IP>:/tmp/
ssh -p 10022 deploy@<VPS_IP> "chmod +x /tmp/vps-harden-ssh.sh && /tmp/vps-harden-ssh.sh 10022"
```

### 3. アプリケーションデプロイ

```bash
# deploy.sh でアプリケーションをデプロイ
./deploy.sh
```

## シークレット管理

| 環境変数 | 説明 | 取得元 |
|---|---|---|
| `OS_AUTH_URL` | OpenStack 認証 URL | ConoHa API情報 |
| `OS_USERNAME` | API ユーザー名 | ConoHa API情報 |
| `OS_PASSWORD` | API パスワード | ConoHa API情報 |
| `OS_TENANT_ID` | テナント ID | ConoHa API情報 |
| `OS_USER_DOMAIN_NAME` | ドメイン名（`Default` 固定） | - |
| `OS_PROJECT_DOMAIN_NAME` | プロジェクトドメイン名（`Default` 固定） | - |

> `terraform.tfvars` に `ssh_public_key` を記載する。このファイルは `.gitignore` 済み。

## VPS 削除

```bash
terraform destroy
# "yes" と入力して確定
```

> **注意**: VPS 上のデータはすべて失われる。必要に応じてバックアップを取得すること。

## ディレクトリ構成

```
infra/terraform/
├── main.tf                          # ルートモジュール
├── variables.tf                     # ルート変数
├── outputs.tf                       # ルート出力
├── versions.tf                      # プロバイダーバージョン
├── terraform.tfvars.example         # 変数サンプル
├── README.md                        # このファイル
└── modules/
    └── conoha-vps/
        ├── main.tf                  # リソース定義
        ├── variables.tf             # モジュール変数
        ├── outputs.tf               # モジュール出力
        └── templates/
            └── cloud-init.yaml.tpl  # cloud-init テンプレート
```

## トラブルシューティング

### `terraform init` が失敗する

```
Error: Failed to query available provider packages
```

ネットワーク接続を確認。プロキシ環境の場合は `HTTPS_PROXY` を設定する。

### `terraform plan` で認証エラー

```
Error: Unauthorized
```

`OS_*` 環境変数が正しく設定されているか確認:

```bash
env | grep OS_
```

### cloud-init が完了しない

VPS にログインしてログを確認:

```bash
ssh -p 10022 deploy@<VPS_IP>
sudo cat /var/log/cloud-init-output.log
```

### SSH 接続できない

1. ConoHa コントロールパネルでセキュリティグループのルールを確認
2. VPS の VNC コンソールからログインして UFW の状態を確認:

```bash
sudo ufw status
```

3. cloud-init が完了しているか確認:

```bash
cloud-init status
```
