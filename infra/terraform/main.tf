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
}

# ============================================================
# Cloudflare（将来追加予定）
# ============================================================
# module "cloudflare" {
#   source = "./modules/cloudflare"
#   ...
# }
