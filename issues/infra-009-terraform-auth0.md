# Auth0 Terraform管理

## 概要

Auth0のダッシュボード手動管理をTerraform IaC管理に移行する。既存の`infra/terraform/`構成にAuth0 moduleを追加し、Application・Role・Action・Connectionを管理対象とする。

## 背景

- Auth0の設定がダッシュボード上の手動管理のみで、構成の再現性・変更追跡ができない
- 既にTerraformでConoHa VPSを管理しており（`infra/terraform/`）、同じ手法でAuth0もIaC化したい
- M2M Applicationは作成済み、stateはローカル管理を維持

## 管理対象リソース

| リソース | Terraform Resource | 用途 |
|---|---|---|
| Next.js Application | `auth0_client` | OIDCクライアント（AUTH0_CLIENT_ID/SECRET） |
| Roles | `auth0_role` × 2 | `viewer`（管理者）, `dumper`（投稿権限） |
| Action | `auth0_action` | post-loginでJWTに`https://private.s-hirano.com/roles`クレーム付与 |
| Action Trigger | `auth0_trigger_actions` | post-loginフローにActionバインド |
| Connection | `auth0_connection` | ログイン方法（DB接続、Social等） |

## 実装タスク

- [ ] `versions.tf`に`auth0/auth0` provider追加
- [ ] `provider "auth0"` ブロック追加（`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` 環境変数から読み込み）
- [ ] `modules/auth0/main.tf` 作成 — 全リソース定義
- [ ] `modules/auth0/variables.tf` 作成 — アプリ名、コールバックURL、ロール名等
- [ ] `modules/auth0/outputs.tf` 作成 — client_id, client_secret等
- [ ] `main.tf`にmodule呼び出し追加
- [ ] ルートの`variables.tf` / `outputs.tf`更新
- [ ] Auth0ダッシュボードから各リソースIDを確認し`terraform import`で取り込み
- [ ] `terraform plan`で差分なし確認
- [ ] 小さな変更で`terraform apply`動作確認

## ディレクトリ構造

```
infra/terraform/
├── main.tf              # ← module "auth0" 追加
├── variables.tf         # ← auth0関連変数追加
├── outputs.tf           # ← auth0関連output追加
├── versions.tf          # ← auth0 provider追加
└── modules/
    ├── conoha-vps/      # 既存
    └── auth0/           # 新規
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## シークレット管理

| シークレット | 管理方法 |
|---|---|
| Auth0 M2M認証情報（Terraform用） | 環境変数 (`AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`) |
| tfstate | ローカル保存（既存方針を維持、`.gitignore`で除外済み） |

## 注意事項

- Terraform用M2M Applicationの認証情報は環境変数で渡す（tfvarsに書かない）
- `auth0_action`のJavaScriptコードはヒアドキュメントで埋め込み（Auth0ダッシュボードのAction内容を転記）
- Connection設定はAuth0ダッシュボードを確認して正確に反映する
- import時は`terraform plan`で差分なし（No changes）を必ず確認

## 参考

- [Auth0 Terraform Provider](https://registry.terraform.io/providers/auth0/auth0/latest/docs)
- 関連issue: `infra-003-terraform-vps-cloudflare.md`
