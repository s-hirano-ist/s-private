# Doppler + GitHub Secrets IaC マイグレーション手順

## 前提

- Terraform がローカルにインストールされていること
- Doppler アカウントを作成済みであること
- GitHub Fine-grained PAT を作成済み（Secrets + Variables の Read/Write 権限）

## 手順

### 1. Doppler セットアップ

- [ ] [Doppler](https://www.doppler.com/) でプロジェクト `s-private` を作成（または Terraform で新規作成）
- [ ] `dev` 環境に全 env vars を登録（`app/src/env.ts` のスキーマ参照）
- [ ] `ci` 環境に CI 用シークレットを登録（`NPM_TOKEN`, `ACTIONS_GITHUB_TOKEN`）
- [ ] `prd` 環境に本番用 env vars を登録
- [ ] Doppler → Vercel integration を設定（本番・プレビュー環境に自動同期）

### 2. ローカル動作確認

- [ ] `doppler login` + `doppler setup` でローカル環境をセットアップ
- [ ] `doppler run -- pnpm dev` で開発サーバーが起動することを確認

### 3. Terraform で Doppler + GitHub Secrets を管理

- [ ] Fine-grained PAT を作成（GitHub Settings > Developer settings > Fine-grained tokens）
  - Repository access: `s-hirano-ist/s-private` のみ
  - Permissions: Secrets (Read/Write), Variables (Read/Write), Metadata (Read)
- [ ] 環境変数を設定
  ```bash
  # Doppler（個人トークン: Terraform プロバイダ用）
  export DOPPLER_TOKEN=$(doppler configure get token --plain)

  # GitHub
  export GITHUB_TOKEN="<PAT>"
  ```
- [ ] `cd infra/terraform && terraform init`
- [ ] 既存 Doppler リソースを import（プロジェクトが既存の場合）
  ```bash
  terraform import 'module.doppler.doppler_project.this' s-private
  terraform import 'module.doppler.doppler_environment.this["dev"]' s-private.dev
  terraform import 'module.doppler.doppler_environment.this["ci"]' s-private.ci
  terraform import 'module.doppler.doppler_environment.this["prd"]' s-private.prd
  # 各シークレット（例）:
  terraform import 'module.doppler.doppler_secret.this["dev/DATABASE_URL"]' s-private.dev.DATABASE_URL
  terraform import 'module.doppler.doppler_secret.this["prd/DATABASE_URL"]' s-private.dev.DATABASE_URL
  # ... 全シークレットについて繰り返す
  ```
- [ ] 既存 GitHub Secrets を import
  ```bash
  terraform import 'module.github.github_actions_secret.this["NPM_TOKEN"]' s-private/NPM_TOKEN
  terraform import 'module.github.github_actions_secret.this["ACTIONS_GITHUB_TOKEN"]' s-private/ACTIONS_GITHUB_TOKEN
  ```
- [ ] `terraform plan` で差分確認
- [ ] `terraform apply`

### 4. AI エージェント用 .env.local を作成

- [ ] Terraform apply 後、AI エージェント用サービストークンを取得
  ```bash
  cd infra/terraform
  echo "DOPPLER_TOKEN=$(terraform output -raw doppler_dev_ai_agent_service_token)" > ../../.env.local
  ```
- [ ] `source script/doppler-env.sh` で環境変数が注入されることを確認

### 5. 旧 GitHub Secrets / Variables を削除

- [ ] `gh secret delete VERCEL_TOKEN --repo s-hirano-ist/s-private`
- [ ] `gh secret delete VERCEL_ORG_ID --repo s-hirano-ist/s-private`
- [ ] `gh secret delete VERCEL_PROJECT_ID --repo s-hirano-ist/s-private`
- [ ] `gh variable delete VERCEL_ORG_ID --repo s-hirano-ist/s-private`（存在する場合）
- [ ] `gh variable delete VERCEL_PROJECT_ID --repo s-hirano-ist/s-private`（存在する場合）

### 6. CI 動作確認

- [ ] 変更を push し、CI ワークフローが正常に動作することを確認
- [ ] prisma-deploy ワークフローが production 環境で動作することを確認

### 7. クリーンアップ

- [ ] Vercel Dashboard の Environment Variables を確認（Doppler integration で同期されていること）
- [ ] 旧手動作成の Service Token を Doppler ダッシュボードから削除
- [ ] この todo.md を削除
