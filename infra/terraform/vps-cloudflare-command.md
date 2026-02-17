# cf-terraforming エクスポートコマンド一覧

## 前提

以下の環境変数をセット済みであること。

```bash
export CLOUDFLARE_API_TOKEN="<APIトークン>"
export CLOUDFLARE_ZONE_ID="<ゾーンID>"
export CLOUDFLARE_ACCOUNT_ID="<アカウントID>"
```

**実行ディレクトリ**: `infra/terraform/`

## HCL コード生成（generate）

```bash
# DNS レコード（Zone スコープ）
CLOUDFLARE_ACCOUNT_ID= cf-terraforming generate \
  --zone $CLOUDFLARE_ZONE_ID \
  --resource-type cloudflare_record \
  > tmp/cloudflare_record.tf

# Tunnel 定義（Account スコープ）
CLOUDFLARE_ZONE_ID= cf-terraforming generate \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_tunnel_cloudflared \
  > tmp/cloudflare_zero_trust_tunnel_cloudflared.tf

# Tunnel の Public Hostname 設定
CLOUDFLARE_ZONE_ID= cf-terraforming generate \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_tunnel_cloudflared_config \
  > tmp/cloudflare_zero_trust_tunnel_cloudflared_config.tf

# Access Application
CLOUDFLARE_ZONE_ID= cf-terraforming generate \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_application \
  > tmp/cloudflare_zero_trust_access_application.tf

# Access Policy
CLOUDFLARE_ZONE_ID= cf-terraforming generate \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_policy \
  > tmp/cloudflare_zero_trust_access_policy.tf

# Service Token
CLOUDFLARE_ZONE_ID= cf-terraforming generate \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_service_token \
  > tmp/cloudflare_zero_trust_access_service_token.tf
```

## import ブロック生成

```bash
# DNS レコード（Zone スコープ）
CLOUDFLARE_ACCOUNT_ID= cf-terraforming import \
  --zone $CLOUDFLARE_ZONE_ID \
  --resource-type cloudflare_record \
  --modern-import-block \
  > tmp/cloudflare_record_import.tf

# Tunnel 定義
CLOUDFLARE_ZONE_ID= cf-terraforming import \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_tunnel_cloudflared \
  --modern-import-block \
  > tmp/cloudflare_zero_trust_tunnel_cloudflared_import.tf

# Tunnel の Public Hostname 設定
CLOUDFLARE_ZONE_ID= cf-terraforming import \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_tunnel_cloudflared_config \
  --modern-import-block \
  > tmp/cloudflare_zero_trust_tunnel_cloudflared_config_import.tf

# Access Application
CLOUDFLARE_ZONE_ID= cf-terraforming import \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_application \
  --modern-import-block \
  > tmp/cloudflare_zero_trust_access_application_import.tf

# Access Policy
CLOUDFLARE_ZONE_ID= cf-terraforming import \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_policy \
  --modern-import-block \
  > tmp/cloudflare_zero_trust_access_policy_import.tf

# Service Token
CLOUDFLARE_ZONE_ID= cf-terraforming import \
  --account $CLOUDFLARE_ACCOUNT_ID \
  --resource-type cloudflare_zero_trust_access_service_token \
  --modern-import-block \
  > tmp/cloudflare_zero_trust_access_service_token_import.tf
```

## 検証

1. `terraform init` が正常に完了すること
2. generate で `tmp/` に 6 つの `.tf` ファイルが生成されること
3. import でさらに 6 つの `_import.tf` ファイルが生成されること
4. 生成されたファイルの内容を目視確認して、期待するリソースが含まれていること
