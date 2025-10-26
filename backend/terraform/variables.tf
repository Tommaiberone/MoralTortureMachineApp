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
  description = "Environment name (dev or prod) - used in all resource names"
  type        = string
  default     = "prod"
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
    "https://d1vklv6uo7wyz2.cloudfront.net",
    "http://localhost:5173",
    "https://moraltorturemachine.com",
    "https://www.moraltorturemachine.com"
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
