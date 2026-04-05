# Doppler 移行 + GitHub Secrets IaC マイグレーション手順

## 前提

- Terraform がローカルにインストールされていること
- Doppler アカウントを作成済みであること
- GitHub Fine-grained PAT を作成済み（Secrets + Variables の Read/Write 権限）

## 手順

### 1. Doppler セットアップ

- [ ] [Doppler](https://www.doppler.com/) でプロジェクト `s-private` を作成
- [ ] `dev` 環境に全 env vars を登録（`app/src/env.ts` のスキーマ参照）
- [ ] `prd` 環境に本番用 env vars を登録
- [ ] Doppler → Vercel integration を設定（本番・プレビュー環境に自動同期）
- [ ] Service Token を作成（dev 用、prd 用の2つ）

### 2. ローカル動作確認

- [ ] `doppler login` + `doppler setup` でローカル環境をセットアップ
- [ ] `doppler run -- pnpm dev` で開発サーバーが起動することを確認

### 3. Terraform でGitHub Secrets を管理

- [ ] Fine-grained PAT を作成（GitHub Settings > Developer settings > Fine-grained tokens）
  - Repository access: `s-hirano-ist/s-private` のみ
  - Permissions: Secrets (Read/Write), Variables (Read/Write), Metadata (Read)
- [ ] 環境変数を設定
  ```bash
  export GITHUB_TOKEN="<PAT>"
  export TF_VAR_doppler_token_dev="dp.st.dev_xxx"
  export TF_VAR_doppler_token_prd="dp.st.prd_xxx"
  export TF_VAR_npm_token="..."
  export TF_VAR_actions_github_token="ghp_..."
  ```
- [ ] `cd infra/terraform && terraform init`
- [ ] 既存 secrets を import
  ```bash
  terraform import 'module.github.github_actions_secret.this["NPM_TOKEN"]' s-private/NPM_TOKEN
  terraform import 'module.github.github_actions_secret.this["ACTIONS_GITHUB_TOKEN"]' s-private/ACTIONS_GITHUB_TOKEN
  ```
- [ ] `terraform plan` で差分確認（DOPPLER_TOKEN_DEV/PRD が新規作成、NPM_TOKEN/ACTIONS_GITHUB_TOKEN は import 済み）
- [ ] `terraform apply`

### 4. 旧 GitHub Secrets / Variables を削除

- [ ] `gh secret delete VERCEL_TOKEN --repo s-hirano-ist/s-private`
- [ ] `gh secret delete VERCEL_ORG_ID --repo s-hirano-ist/s-private`
- [ ] `gh secret delete VERCEL_PROJECT_ID --repo s-hirano-ist/s-private`
- [ ] `gh variable delete VERCEL_ORG_ID --repo s-hirano-ist/s-private`（存在する場合）
- [ ] `gh variable delete VERCEL_PROJECT_ID --repo s-hirano-ist/s-private`（存在する場合）

### 5. CI 動作確認

- [ ] 変更を push し、CI ワークフローが正常に動作することを確認
- [ ] prisma-deploy ワークフローが production 環境で動作することを確認

### 6. クリーンアップ

- [ ] Vercel Dashboard の Environment Variables を確認（Doppler integration で同期されていること）
- [ ] この todo.md を削除
