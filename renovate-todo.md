# Renovate self-host 移行 TODO（手動セットアップ）

Mend Cloud 無料枠（1 job = 3GB）の `kernel-out-of-memory` を回避するため、Renovate を
GitHub Actions の self-host（`.github/workflows/renovate.yaml`）へ移行した。runner は 16GB RAM の
ため Mend のメモリ上限から解放される。認証は短命トークンの **専用 GitHub App** を使う。

このファイルは下記の手動ステップが完了したら削除すること。

## 背景（なぜ App 版か）

- 過去に PAT ベースの self-host 版が存在したが、全 Dependabot 化の際に削除 → その後
  「Dependabot が pnpm 11 非対応」で npm を Renovate に差し戻した際、self-host を復活させず
  Mend Cloud に戻ったため OOM が再発していた。
- 今回は PAT より安全な GitHub App（短命トークン・`platformCommit` で Verified コミット）で再構築。

---

## 手動ステップ（GitHub UI 操作のため要手動）

### 1. 専用 GitHub App を作成
GitHub → Settings → Developer settings → GitHub Apps → **New GitHub App**

- [ ] **Repository permissions** を設定
  - Contents: **Read and write**（ブランチ・コミット・lockfile 更新）
  - Pull requests: **Read and write**（PR 作成・automerge 有効化）
  - Issues: **Read and write**（Dependency Dashboard issue の維持）
  - Metadata: Read-only（必須・自動付与）
  - ※ `enabledManagers` は npm/mise/nvm のみでワークフローは触らないため **Workflows 権限は不要**
- [ ] **Webhook** の "Active" を **オフ**（cron / workflow_dispatch 起動なのでイベント購読不要）
- [ ] Where can this app be installed: **Only on this account**
- [ ] 作成後、**Private key を生成**（`.pem` をダウンロード）し、**App ID** を控える
- [ ] **Install App** で `s-hirano-ist/s-private` にインストール

### 2. Secrets を登録
```bash
gh secret set RENOVATE_APP_ID --body "<App ID>"
gh secret set RENOVATE_APP_PRIVATE_KEY < ~/Downloads/<your-app>.private-key.pem
```
- [ ] `RENOVATE_APP_ID` 登録
- [ ] `RENOVATE_APP_PRIVATE_KEY` 登録

### 3. リポジトリ設定
- [ ] Settings → General → Pull Requests → **Allow auto-merge** を有効化
      （`platformAutomerge: true` の前提）

### 4. Mend Renovate App を撤去（重複 PR 防止）
- [ ] GitHub → Settings → Integrations → Applications → **Renovate** → Configure →
      `s-private` をアクセス対象から外す（または Uninstall）

---

## 検証（手動 1〜4 完了後）

- [ ] **dry-run**: `gh workflow run renovate.yaml -f dryRun=true -f logLevel=debug`
      → Actions ログでリポジトリが処理され、OOM もエラーも無く完走することを確認
- [ ] **本実行**: `gh workflow run renovate.yaml` → App ユーザーが `renovate/*` ブランチで
      PR を作成し、`dependencies` ラベルが付くことを確認
- [ ] **CI 連動**: 作成された Renovate PR 上で既存 `ci.yaml` が発火していることを確認
      （= App トークンがワークフローを起動できている証拠。`GITHUB_TOKEN` では起動しない）
- [ ] **automerge**: devDependencies / mise の patch・minor PR が CI 通過後に自動マージされ、
      main の branch protection と矛盾しないことを確認
- [ ] **Dashboard**: Dependency Dashboard issue が self-host により更新されることを確認
- [ ] **重複なし**: Mend 撤去後、Mend 由来の PR が新規に出ないことを数日観察

---

## 後片付け

- [ ] 移行確認後、旧 PAT secret `RENOVATE_TOKEN` を削除（App 版では未使用）
      `gh secret delete RENOVATE_TOKEN`
- [ ] Mend が残した既存の `renovate/*` リモートブランチを整理（self-host が作り直す）
- [ ] このファイル `renovate-todo.md` を削除
