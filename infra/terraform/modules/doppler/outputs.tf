output "project_name" {
  description = "Doppler プロジェクト名"
  value       = doppler_project.this.name
}

output "ci_dev_service_token" {
  description = "CI 用サービストークン（dev 環境、読み取り専用）"
  value       = doppler_service_token.ci_dev.key
  sensitive   = true
}

output "ci_prd_service_token" {
  description = "CI 用サービストークン（prd 環境、読み取り専用）"
  value       = doppler_service_token.ci_prd.key
  sensitive   = true
}

output "dev_ai_agent_service_token" {
  description = "AI エージェント用サービストークン（dev 環境、読み取り専用）"
  value       = doppler_service_token.dev_ai_agent.key
  sensitive   = true
}

output "ci_secrets" {
  description = "CI 環境のシークレットマップ（GitHub Secrets 用）"
  value       = data.doppler_secrets.ci.map
  sensitive   = true
}
