# ============================================================
# リポジトリシークレット
# ============================================================
resource "github_actions_secret" "this" {
  for_each        = var.secrets
  repository      = var.repository
  secret_name     = each.key
  plaintext_value = each.value
}

# ============================================================
# リポジトリ変数
# ============================================================
resource "github_actions_variable" "this" {
  for_each      = var.variables
  repository    = var.repository
  variable_name = each.key
  value         = each.value
}
