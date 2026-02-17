# ============================================================
# SSH キーペア
# ============================================================
resource "openstack_compute_keypair_v2" "deploy" {
  name       = var.keypair_name
  public_key = var.ssh_public_key
}

# ============================================================
# セキュリティグループ
# ============================================================
resource "openstack_networking_secgroup_v2" "vps" {
  name                 = var.security_group_name
  description          = "Security group for ${var.instance_name}"
  delete_default_rules = true
}

# SSH ingress（カスタムポートのみ）
resource "openstack_networking_secgroup_rule_v2" "ssh_ingress" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = var.ssh_port
  port_range_max    = var.ssh_port
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.vps.id
}

# Egress IPv4（Docker pull, apt, Cloudflare Tunnel に必要）
resource "openstack_networking_secgroup_rule_v2" "egress_v4" {
  direction         = "egress"
  ethertype         = "IPv4"
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.vps.id
}

# Egress IPv6
resource "openstack_networking_secgroup_rule_v2" "egress_v6" {
  direction         = "egress"
  ethertype         = "IPv6"
  remote_ip_prefix  = "::/0"
  security_group_id = openstack_networking_secgroup_v2.vps.id
}

# ============================================================
# OS イメージ（名前 → UUID 解決）
# ============================================================
data "openstack_images_image_v2" "os" {
  name        = var.image_name
  most_recent = true
}

# ============================================================
# ブートボリューム（イメージから事前作成）
# ============================================================
resource "openstack_blockstorage_volume_v3" "boot" {
  name        = "${var.instance_name}-boot"
  size        = var.volume_size
  image_id    = data.openstack_images_image_v2.os.id
  volume_type = var.volume_type
}

# ============================================================
# VPS インスタンス
# ============================================================
resource "openstack_compute_instance_v2" "vps" {
  name            = var.instance_name
  flavor_name     = var.flavor_name
  key_pair        = openstack_compute_keypair_v2.deploy.name
  security_groups = [openstack_networking_secgroup_v2.vps.name]

  block_device {
    uuid             = openstack_blockstorage_volume_v3.boot.id
    source_type      = "volume"
    destination_type = "volume"
  }

  depends_on = [openstack_blockstorage_volume_v3.boot]

  user_data = templatefile(
    "${path.module}/templates/cloud-init.yaml.tpl",
    {
      ssh_public_key = var.ssh_public_key
      ssh_port       = var.ssh_port
    }
  )
}
