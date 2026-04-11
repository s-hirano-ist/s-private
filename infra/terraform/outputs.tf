# ConoHa VPS（一時無効化: Doppler 移行に専念）
# output "instance_id" {
#   description = "VPS インスタンス ID"
#   value       = module.conoha_vps.instance_id
# }
#
# output "instance_name" {
#   description = "VPS インスタンス名"
#   value       = module.conoha_vps.instance_name
# }
#
# output "access_ip_v4" {
#   description = "VPS のパブリック IPv4 アドレス"
#   value       = module.conoha_vps.access_ip_v4
# }
#
# output "security_group_id" {
#   description = "セキュリティグループ ID"
#   value       = module.conoha_vps.security_group_id
# }
#
# output "security_group_name" {
#   description = "セキュリティグループ名"
#   value       = module.conoha_vps.security_group_name
# }
#
# output "ssh_connection_command" {
#   description = "SSH 接続コマンド"
#   value       = module.conoha_vps.ssh_connection_command
# }

# ============================================================
# GitHub
# ============================================================

output "github_secret_names" {
  description = "GitHub 管理対象シークレット名"
  value       = module.github.secret_names
}

# ============================================================
# Doppler
# ============================================================

output "doppler_project" {
  description = "Doppler プロジェクト名"
  value       = module.doppler.project_name
}

output "doppler_ci_dev_service_token" {
  description = "CI 用 Doppler サービストークン（dev）"
  value       = module.doppler.ci_dev_service_token
  sensitive   = true
}

output "doppler_ci_prd_service_token" {
  description = "CI 用 Doppler サービストークン（prd）"
  value       = module.doppler.ci_prd_service_token
  sensitive   = true
}

output "doppler_dev_ai_agent_service_token" {
  description = "AI エージェント用 Doppler サービストークン（dev、読み取り専用）"
  value       = module.doppler.dev_ai_agent_service_token
  sensitive   = true
}
