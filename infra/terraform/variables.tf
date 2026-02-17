variable "instance_name" {
  description = "ConoHa VPS インスタンス名"
  type        = string
  default     = "conoha-vps"
}

variable "image_name" {
  description = "OS イメージ名"
  type        = string
  default     = "Ubuntu 24.04"
}

variable "flavor_name" {
  description = "ConoHa フレーバー（プラン）名"
  type        = string
  default     = "g2l-t-c3m2"
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
