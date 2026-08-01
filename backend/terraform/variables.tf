variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "stack_name" {
  description = "Base name of the stack (used as prefix for all resources, without environment suffix)"
  type        = string
  default     = "moral-torture-machine"
}

variable "environment" {
  description = "Cloud environment name. Only the production stack is supported."
  type        = string
  default     = "prod"

  validation {
    condition     = var.environment == "prod"
    error_message = "Only the prod AWS stack is supported; development is local-only."
  }
}

variable "alert_email" {
  description = "Recipient for AWS Budget notifications and CloudWatch alarms (see docs/OPERATIONS_RUNBOOK.md)"
  type        = string
  default     = "tommasobersani@gmail.com"
}

variable "groq_api_key" {
  description = "Groq API Key for generating dilemmas"
  type        = string
  sensitive   = true
  default     = "SET_THIS_LATER"
}

variable "google_oauth_client_id" {
  description = "Google OAuth 2.0 web client ID used by Cognito federation"
  type        = string
  sensitive   = true

  validation {
    condition     = length(trimspace(var.google_oauth_client_id)) > 10
    error_message = "A Google OAuth web client ID is required."
  }
}

variable "google_oauth_client_secret" {
  description = "Google OAuth 2.0 web client secret used by Cognito federation"
  type        = string
  sensitive   = true

  validation {
    condition     = length(trimspace(var.google_oauth_client_secret)) > 10
    error_message = "A Google OAuth web client secret is required."
  }
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default = [
    "https://tommaiberone.github.io",
    "http://localhost:3000",
    "https://d2l4ckgwzkl5t3.cloudfront.net",
    "http://localhost:5173",
    "https://moraltorturemachine.com",
    "https://www.moraltorturemachine.com",
    "https://localhost"
  ]
}

variable "cloudfront_domain" {
  description = "CloudFront domain name for the frontend (leave empty if not yet created)"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 7
}

variable "abuse_burst_guard_enabled" {
  description = "Enable the best-effort, per-Lambda-container burst guard"
  type        = bool
  default     = true
}

variable "abuse_global_requests_per_minute" {
  description = "Maximum requests per minute per transient network source in each Lambda container"
  type        = number
  default     = 120

  validation {
    condition     = var.abuse_global_requests_per_minute > 0
    error_message = "The global burst limit must be positive."
  }
}

variable "abuse_ai_requests_per_minute" {
  description = "Maximum AI endpoint requests per minute per transient network source in each Lambda container"
  type        = number
  default     = 12

  validation {
    condition     = var.abuse_ai_requests_per_minute > 0
    error_message = "The AI burst limit must be positive."
  }
}

variable "abuse_analytics_batches_per_minute" {
  description = "Maximum analytics batches per minute per transient network source in each Lambda container"
  type        = number
  default     = 30

  validation {
    condition     = var.abuse_analytics_batches_per_minute > 0
    error_message = "The analytics ingestion burst limit must be positive."
  }
}

variable "abuse_auth_write_requests_per_minute" {
  description = "Maximum authenticated write requests (claim, delete, /auth/me) per minute per transient network source in each Lambda container"
  type        = number
  default     = 10

  validation {
    condition     = var.abuse_auth_write_requests_per_minute > 0
    error_message = "The authenticated write burst limit must be positive."
  }
}

variable "abuse_duel_write_requests_per_minute" {
  description = "Maximum Moral Duel write requests (profile/challenge create, join, submit, rematch) per minute per transient network source in each Lambda container"
  type        = number
  default     = 15

  validation {
    condition     = var.abuse_duel_write_requests_per_minute > 0
    error_message = "The Moral Duel write burst limit must be positive."
  }
}

variable "abuse_public_read_requests_per_minute" {
  description = "Maximum public unauthenticated reads (profiles, challenge teaser/compare, batch dilemma lookup) per minute per transient network source in each Lambda container"
  type        = number
  default     = 60

  validation {
    condition     = var.abuse_public_read_requests_per_minute > 0
    error_message = "The public read burst limit must be positive."
  }
}

variable "ops_error_notifications_enabled" {
  description = "TASK-104: whether every 4xx/5xx response emails the ops_alerts SNS topic"
  type        = bool
  default     = true
}

variable "ops_error_notification_cooldown_seconds" {
  description = "Minimum seconds between two ops error notifications for the same (status_code, path) pair per warm Lambda container"
  type        = number
  default     = 600

  validation {
    condition     = var.ops_error_notification_cooldown_seconds > 0
    error_message = "The ops error notification cooldown must be positive."
  }
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
