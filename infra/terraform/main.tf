# ============================================================
# ConoHa VPS（一時無効化: Doppler 移行に専念）
# ============================================================
# module "conoha_vps" {
#   source = "./modules/conoha-vps"
#
#   instance_name       = var.instance_name
#   image_name          = var.image_name
#   flavor_name         = var.flavor_name
#   ssh_public_key      = var.ssh_public_key
#   ssh_port            = var.ssh_port
#   keypair_name        = var.keypair_name
#   security_group_name = var.security_group_name
#   volume_size         = var.volume_size
#   volume_type         = var.volume_type
# }

# ============================================================
# Doppler（環境変数管理）
# ============================================================
module "doppler" {
  source = "./modules/doppler"

  project_name        = "s-private"
  project_description = "s-private content management system"
}

# ============================================================
# GitHub リポジトリ設定
# ============================================================
module "github" {
  source = "./modules/github"

  repository = var.github_repository

  secrets = {
    DOPPLER_TOKEN_DEV    = module.doppler.ci_dev_service_token
    DOPPLER_TOKEN_PRD    = module.doppler.ci_prd_service_token
    NPM_TOKEN            = module.doppler.ci_secrets["NPM_TOKEN"]
    ACTIONS_GITHUB_TOKEN = module.doppler.ci_secrets["ACTIONS_GITHUB_TOKEN"]
  }
}

# ============================================================
# Cloudflare（将来追加予定）
# ============================================================
# module "cloudflare" {
#   source = "./modules/cloudflare"
#   ...
# }
