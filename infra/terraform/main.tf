# ============================================================
# ConoHa VPS
# ============================================================
module "conoha_vps" {
  source = "./modules/conoha-vps"

  instance_name       = var.instance_name
  image_name          = var.image_name
  flavor_name         = var.flavor_name
  ssh_public_key      = var.ssh_public_key
  ssh_port            = var.ssh_port
  keypair_name        = var.keypair_name
  security_group_name = var.security_group_name
  volume_size         = var.volume_size
  volume_type         = var.volume_type
}

# ============================================================
# GitHub リポジトリ設定
# ============================================================
module "github" {
  source = "./modules/github"

  repository = var.github_repository

  secrets = {
    DOPPLER_TOKEN_DEV    = var.doppler_token_dev
    DOPPLER_TOKEN_PRD    = var.doppler_token_prd
    NPM_TOKEN            = var.npm_token
    ACTIONS_GITHUB_TOKEN = var.actions_github_token
  }
}

# ============================================================
# Cloudflare（将来追加予定）
# ============================================================
# module "cloudflare" {
#   source = "./modules/cloudflare"
#   ...
# }
