#cloud-config
# ConoHa VPS cloud-init テンプレート
# vps-init.sh の 6 ステップを再現（SSH ハードニングを除く）

# ============================================================
# [1/6] deploy ユーザー作成
# ============================================================
users:
  - default
  - name: deploy
    groups: [sudo, docker]
    shell: /bin/bash
    sudo: ["ALL=(ALL) NOPASSWD:ALL"]
    ssh_authorized_keys:
      - ${ssh_public_key}

# ============================================================
# [2/6] Docker + git インストール（パッケージ部分）
# ============================================================
packages:
  - git
  - ufw
  - fail2ban
  - unattended-upgrades

# ============================================================
# [4/6] fail2ban 設定
# [5/6] 自動セキュリティ更新
# [6/6] Docker ログローテーション
# ============================================================
write_files:
  - path: /etc/fail2ban/jail.local
    content: |
      [sshd]
      port = ${ssh_port}
    owner: root:root
    permissions: "0644"

  - path: /etc/apt/apt.conf.d/20auto-upgrades
    content: |
      APT::Periodic::Update-Package-Lists "1";
      APT::Periodic::Unattended-Upgrade "1";
    owner: root:root
    permissions: "0644"

  - path: /etc/docker/daemon.json
    content: |
      {
        "log-driver": "json-file",
        "log-opts": {
          "max-size": "10m",
          "max-file": "3"
        }
      }
    owner: root:root
    permissions: "0644"

# ============================================================
# [2/6] Docker インストール（スクリプト実行）
# [3/6] UFW ファイアウォール設定
# ============================================================
runcmd:
  # Docker インストール
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker
  - usermod -aG docker deploy

  # UFW ファイアウォール設定
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ${ssh_port}/tcp comment "SSH custom port"
  - ufw allow 22/tcp comment "SSH default port (temporary)"
  - echo "y" | ufw enable

  # fail2ban 再起動
  - systemctl restart fail2ban

  # Docker ログローテーション反映
  - systemctl restart docker
