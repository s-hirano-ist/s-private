# Issue: embedding-api の Docker イメージを CD で DockerHub に push する

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Infrastructure / CI/CD |
| **Priority** | MEDIUM |
| **Check Item** | embedding-api の Docker ビルド＆push を CI/CD パイプラインに組み込む |
| **Affected File** | `.github/workflows/cd.yaml`, `.github/workflows/ci.yaml`, `services/embedding-api/compose.yaml` |

## Problem Description

現在 `cd.yaml` では `s-private`（app）と `s-storybook` の2つの Docker イメージのみ DockerHub に push している。
`embedding-api` は VPS 上で `docker compose build` による手動ビルド・デプロイを行っている状態であり、デプロイの自動化・再現性確保のために CD パイプラインに組み込む。

### 現状

- `cd.yaml`: `build-push-s-private` / `build-push-storybook` の2ジョブ
- `ci.yaml`: `docker-build-app` / `docker-build-storybook` の2ジョブ（PR 時のビルドチェック）
- `embedding-api`: VPS 上で `services/embedding-api/compose.yaml` の `build:` ディレクティブを使い手動ビルド

### embedding-api の特徴（app との違い）

- Dockerfile: `services/embedding-api/Dockerfile`（context はモノレポルート）
- **ビルド時シークレット不要**（app と違い `--secret` で環境変数を渡す必要がない）
- ランタイム環境変数（`API_KEY`, `PORT`）は compose.yaml の `environment:` で注入

## Implementation Steps

### 1. `cd.yaml` に `build-push-embedding-api` ジョブを追加

既存の `build-push-storybook` と同じパターンで追加する（シークレット不要のためよりシンプル）。

```yaml
  build-push-embedding-api:
    permissions:
      contents: write
    runs-on: ubuntu-24.04
    if: contains(join(github.event.pull_request.labels.*.name, ','), 'autorelease')
    timeout-minutes: 10
    steps:
      - name: Checkout code
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
        with:
          persist-credentials: false
          submodules: true

      - name: Extract version from package.json
        run: echo "PACKAGE_VERSION=$(jq -r '.version' package.json)" >> "$GITHUB_ENV"

      - name: Log in to Docker Hub
        uses: docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9 # v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@c299e40c65443455700f0fdfc63efafe5b349051 # v5
        with:
          images: ${{ secrets.DOCKER_HUB_USERNAME }}/embedding-api
          tags: |
            type=raw,value=latest
            type=raw,value=${{ env.PACKAGE_VERSION }}

      - name: Build and push Docker image with version tag
        uses: docker/build-push-action@263435318d21b8e681c14492fe198d362a7d2c83 # v6
        with:
          context: .
          file: ./services/embedding-api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}

      - name: Show pushed image tags
        run: echo "Pushed docker image with tag ${{ env.PACKAGE_VERSION }}"
```

**ポイント:**
- `context: .`（モノレポルート。Dockerfile 内で `COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./` 等を行うため）
- `file: ./services/embedding-api/Dockerfile`
- `secrets` ブロック不要（app との主な違い）
- イメージ名: `${{ secrets.DOCKER_HUB_USERNAME }}/embedding-api`
- タグ: `latest` + `package.json` のバージョン（既存パターン踏襲）

### 2. `ci.yaml` に `docker-build-embedding-api` ジョブを追加

PR 時のビルドチェック（push しない）。既存の `docker-build-storybook` と同じパターン。

```yaml
  docker-build-embedding-api:
    runs-on: ubuntu-24.04
    permissions: {}
    timeout-minutes: 15
    concurrency:
      group: ${{ github.workflow }}-docker-build-embedding-api-${{ github.ref }}
    steps:
      - name: Checkout files
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6
        with:
          persist-credentials: false
          submodules: true

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f # v3

      - name: Build embedding-api Docker image
        uses: docker/build-push-action@263435318d21b8e681c14492fe198d362a7d2c83 # v6
        with:
          context: .
          file: ./services/embedding-api/Dockerfile
          push: false
```

### 3. VPS 側の compose.yaml 更新（参考メモ）

CD で DockerHub に push されるようになったら、`services/embedding-api/compose.yaml` の `embedding-api` サービスを `build:` から `image:` に切り替える。

**Before:**
```yaml
services:
  embedding-api:
    build:
      context: ../..
      dockerfile: services/embedding-api/Dockerfile
```

**After:**
```yaml
services:
  embedding-api:
    image: <DOCKER_HUB_USERNAME>/embedding-api:latest
```

これにより VPS 上でのデプロイは `docker compose pull && docker compose up -d` のみで完結する。

## Verification

1. `cd.yaml` の変更が既存の `build-push-s-private` / `build-push-storybook` と同じ action バージョン・パターンであること
2. `ci.yaml` の変更が既存の `docker-build-app` / `docker-build-storybook` と同じパターンであること
3. `autorelease` ラベル付き PR で3つのイメージすべてがビルド＆push されること
4. 通常の PR で `docker-build-embedding-api` がビルドチェック（push: false）として実行されること
5. push されたイメージを VPS 上で `docker compose pull` して正常動作すること

## References

- 既存 CD: `.github/workflows/cd.yaml`（`build-push-s-private`, `build-push-storybook`）
- 既存 CI: `.github/workflows/ci.yaml`（`docker-build-app`, `docker-build-storybook`）
- Dockerfile: `services/embedding-api/Dockerfile`
- VPS compose: `services/embedding-api/compose.yaml`
