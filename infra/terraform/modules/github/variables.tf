variable "repository" {
  description = "GitHub リポジトリ名"
  type        = string
}

variable "secrets" {
  description = "リポジトリシークレット（name -> 値）"
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "variables" {
  description = "リポジトリ変数（name -> 値）。Actions の vars.* で参照可能"
  type        = map(string)
  default     = {}
}
