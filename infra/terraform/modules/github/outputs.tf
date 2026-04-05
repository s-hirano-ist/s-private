output "secret_names" {
  description = "管理対象のシークレット名一覧"
  value       = keys(github_actions_secret.this)
}

output "variable_names" {
  description = "管理対象の変数名一覧"
  value       = keys(github_actions_variable.this)
}
