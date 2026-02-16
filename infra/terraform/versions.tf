terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = "~> 3.0"
    }
  }
}

provider "cloudflare" {
  # CLOUDFLARE_API_TOKEN 環境変数から自動読み込み
}

provider "openstack" {
  # OS_AUTH_URL, OS_USERNAME 等の環境変数から自動読み込み
}
