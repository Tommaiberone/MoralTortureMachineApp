variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "stack_name" {
  description = "Name of the stack (used as prefix for all resources)"
  type        = string
  default     = "moral-torture-machine"
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "moral-torture-machine-dilemmas"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "groq_api_key" {
  description = "Groq API Key for generating dilemmas"
  type        = string
  sensitive   = true
  default     = "SET_THIS_LATER"
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default = [
    "https://tommaiberone.github.io",
    "http://localhost:3000",
    "http://localhost:5173"
  ]
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

variable "populate_db" {
  description = "Whether to populate the database with initial dilemmas via Terraform (not recommended - use GitHub Actions step instead)"
  type        = bool
  default     = false
}

variable "force_rebuild" {
  description = "Force rebuild of Lambda package on every apply"
  type        = bool
  default     = false
}
