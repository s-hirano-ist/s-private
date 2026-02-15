# Terraform + cloud-init による VPS・Cloudflare 完全自動化

## 概要

現在手動 + シェルスクリプトで行っている VPS 初期セットアップと Cloudflare Tunnel 設定を、Terraform + cloud-init で完全自動化する。

## 背景

- `infra/scripts/vps-init.sh` 等のシェルスクリプトで手動ステップは大幅に削減済み
- しかし VPS の作成・削除、Cloudflare Tunnel/Access の設定は依然として手動
- Infrastructure as Code 化により、環境の再現性と変更管理を確保したい

## スコープ

### ConoHa VPS モジュール（OpenStack プロバイダ）

- `openstack_compute_instance_v2` でVPSインスタンスを作成
- `openstack_networking_secgroup_v2` + `openstack_networking_secgroup_rule_v2` でセキュリティグループを管理
- cloud-init テンプレートで OS 初期設定を自動化（現在の `vps-init.sh` 相当）

```hcl
# 想定リソース
resource "openstack_compute_instance_v2" "vps" {
  name            = "conoha-vps"
  image_name      = "Ubuntu 24.04"
  flavor_name     = "g2l-t-c3m2"  # ConoHa のプラン名
  key_pair        = openstack_compute_keypair_v2.deploy.name
  security_groups = [openstack_networking_secgroup_v2.vps_sg.name]
  user_data       = data.template_cloudinit_config.vps.rendered
}
```

### Cloudflare モジュール

- `cloudflare_zero_trust_tunnel_cloudflared` で Tunnel 作成
- `cloudflare_zero_trust_tunnel_cloudflared_config` で Public Hostname 設定
- `cloudflare_zero_trust_access_application` + `cloudflare_zero_trust_access_policy` で Access 設定
- `cloudflare_zero_trust_access_service_token` で Service Token 発行
- `cloudflare_record` で DNS レコード管理（Tunnel 用 CNAME）

### cloud-init テンプレート

現在の `vps-init.sh` の内容を cloud-init 形式に変換:

```yaml
#cloud-config
users:
  - name: deploy
    groups: [sudo, docker]
    shell: /bin/bash
    ssh_authorized_keys:
      - ${ssh_public_key}

packages:
  - git
  - fail2ban
  - unattended-upgrades

runcmd:
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  # ... (vps-init.sh の内容を移植)

write_files:
  - path: /etc/docker/daemon.json
    content: |
      {"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}
  - path: /etc/fail2ban/jail.local
    content: |
      [sshd]
      port = ${ssh_port}
```

## ディレクトリ構造案

```
infra/
├── scripts/           # 既存のシェルスクリプト（Terraform 移行後も補助的に残す）
│   ├── vps-init.sh
│   ├── vps-harden-ssh.sh
│   └── deploy.sh
└── terraform/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── versions.tf
    ├── terraform.tfvars.example
    ├── modules/
    │   ├── conoha-vps/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   ├── outputs.tf
    │   │   └── templates/
    │   │       └── cloud-init.yaml.tpl
    │   └── cloudflare/
    │       ├── main.tf
    │       ├── variables.tf
    │       └── outputs.tf
    └── .gitignore       # *.tfstate, *.tfvars（シークレット含む）
```

## シークレット管理方針

| シークレット | 管理方法 |
|---|---|
| ConoHa API 認証情報 | 環境変数 (`OS_AUTH_URL`, `OS_USERNAME`, `OS_PASSWORD` 等) |
| Cloudflare API Token | 環境変数 (`CLOUDFLARE_API_TOKEN`) |
| SSH 秘密鍵 | ローカルファイル（Terraform 外で管理） |
| SSH 公開鍵 | `terraform.tfvars` または変数で指定 |
| Tunnel Token | Terraform output → VPS の `.env` に手動配置 |
| Service Token | Terraform output → アプリの環境変数に手動配置 |
| tfstate | ローカル保存（個人プロジェクトのため S3 backend は不要） |

**原則**: シークレットは Git にコミットしない。`.gitignore` で `*.tfstate`, `*.tfvars`, `.terraform/` を除外。

## 実装ステップ

1. `infra/terraform/` ディレクトリ構造を作成
2. ConoHa VPS モジュールを実装（OpenStack プロバイダ）
3. cloud-init テンプレートを作成（`vps-init.sh` から移植）
4. Cloudflare モジュールを実装
5. ルートモジュール（`main.tf`）で統合
6. `terraform plan` で動作確認
7. ドキュメント更新（`docs/vps-deployment.md` に Terraform 手順を追記）

## 注意事項

- ConoHa は OpenStack ベースのため、`openstack` プロバイダを使用
- ConoHa 固有の制約（リージョン、フレーバー名等）に注意
- SSH ハードニング（ポート変更、root 無効化）は cloud-init 後に手動実行を推奨（ロックアウト防止）
- 既存の VPS を import する場合は `terraform import` を使用
