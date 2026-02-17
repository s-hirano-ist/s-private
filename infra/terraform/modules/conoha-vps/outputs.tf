output "instance_id" {
  description = "VPS インスタンス ID"
  value       = openstack_compute_instance_v2.vps.id
}

output "instance_name" {
  description = "VPS インスタンス名"
  value       = openstack_compute_instance_v2.vps.name
}

output "access_ip_v4" {
  description = "VPS のパブリック IPv4 アドレス"
  value       = openstack_compute_instance_v2.vps.access_ip_v4
}

output "security_group_id" {
  description = "セキュリティグループ ID"
  value       = openstack_networking_secgroup_v2.vps.id
}

output "security_group_name" {
  description = "セキュリティグループ名"
  value       = openstack_networking_secgroup_v2.vps.name
}

output "ssh_connection_command" {
  description = "SSH 接続コマンド"
  value       = "ssh -p ${var.ssh_port} deploy@${openstack_compute_instance_v2.vps.access_ip_v4}"
}
