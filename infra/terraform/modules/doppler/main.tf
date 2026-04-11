locals {
  environments = {
    dev = "Development"
    ci  = "CI"
    prd = "Production"
  }
}

# ============================================================
# プロジェクト
# ============================================================

resource "doppler_project" "this" {
  name        = var.project_name
  description = var.project_description
}

# ============================================================
# 環境（dev, ci, prd）
# ============================================================

resource "doppler_environment" "this" {
  for_each = local.environments

  project = doppler_project.this.name
  slug    = each.key
  name    = each.value
}

# シークレットは Doppler ダッシュボードで管理（app/src/env.ts 参照）

# ============================================================
# サービストークン
# ============================================================

# GitHub Actions CI 用（dev 環境、読み取り専用）
resource "doppler_service_token" "ci_dev" {
  project = doppler_project.this.name
  config  = doppler_environment.this["dev"].slug
  name    = "github-actions"
  access  = "read"
}

# GitHub Actions CI 用（prd 環境、読み取り専用）
resource "doppler_service_token" "ci_prd" {
  project = doppler_project.this.name
  config  = doppler_environment.this["prd"].slug
  name    = "github-actions"
  access  = "read"
}

# AI エージェント用（dev 環境、読み取り専用）
resource "doppler_service_token" "dev_ai_agent" {
  project = doppler_project.this.name
  config  = doppler_environment.this["dev"].slug
  name    = "ai-agent"
  access  = "read"
}

# ============================================================
# CI 環境シークレット読み取り（GitHub Secrets 伝搬用）
# ============================================================

data "doppler_secrets" "ci" {
  project = doppler_project.this.name
  config  = doppler_environment.this["ci"].slug
}
