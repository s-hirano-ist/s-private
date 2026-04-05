variable "instance_name" {
  description = "ConoHa VPS インスタンス名"
  type        = string
  default     = "conoha-vps"
}

variable "image_name" {
  description = "OS イメージ名"
  type        = string
  default     = "vmi-ubuntu-24.04-amd64"
}

variable "flavor_name" {
  description = "ConoHa フレーバー（プラン）名"
  type        = string
  default     = "g2l-p-c4m4"
}

variable "ssh_public_key" {
  description = "SSH 公開鍵（authorized_keys に設定される）"
  type        = string
  sensitive   = true
}

variable "ssh_port" {
  description = "カスタム SSH ポート番号"
  type        = number
  default     = 10022
}

variable "keypair_name" {
  description = "OpenStack keypair 名"
  type        = string
  default     = "deploy-key"
}

variable "security_group_name" {
  description = "セキュリティグループ名"
  type        = string
  default     = "vps-sg"
}

variable "volume_size" {
  description = "ブートボリュームサイズ（GB）"
  type        = number
  default     = 100
}

variable "volume_type" {
  description = "ブートボリュームタイプ（ConoHa リージョン固有）"
  type        = string
  default     = "c3j1-ds02-boot"
}

# ============================================================
# GitHub
# ============================================================

variable "github_repository" {
  description = "GitHub リポジトリ名"
  type        = string
  default     = "s-private"
}

variable "doppler_token_dev" {
  description = "Doppler Service Token（development 環境用、GitHub Secret 用）"
  type        = string
  sensitive   = true
}

variable "doppler_token_prd" {
  description = "Doppler Service Token（production 環境用、GitHub Secret 用）"
  type        = string
  sensitive   = true
}

variable "npm_token" {
  description = "npm レジストリ認証トークン（GitHub Secret 用）"
  type        = string
  sensitive   = true
}

variable "actions_github_token" {
  description = "GitHub PAT for release-please / create-pull-request（GitHub Secret 用）"
  type        = string
  sensitive   = true
}
