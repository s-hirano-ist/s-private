output "instance_id" {
  description = "VPS インスタンス ID"
  value       = module.conoha_vps.instance_id
}

output "instance_name" {
  description = "VPS インスタンス名"
  value       = module.conoha_vps.instance_name
}

output "access_ip_v4" {
  description = "VPS のパブリック IPv4 アドレス"
  value       = module.conoha_vps.access_ip_v4
}

output "security_group_id" {
  description = "セキュリティグループ ID"
  value       = module.conoha_vps.security_group_id
}

output "security_group_name" {
  description = "セキュリティグループ名"
  value       = module.conoha_vps.security_group_name
}

output "ssh_connection_command" {
  description = "SSH 接続コマンド"
  value       = module.conoha_vps.ssh_connection_command
}
