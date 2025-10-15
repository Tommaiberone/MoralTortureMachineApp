variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-1"
}

variable "stack_name" {
  description = "Name of the stack (used as prefix for all resources)"
  type        = string
  default     = "moral-torture-machine"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
  default     = "moral-torture-machine-frontend"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Custom domain name for the website (e.g., moraltorturemachine.com)"
  type        = string
  default     = ""
}

variable "use_custom_domain" {
  description = "Whether to use a custom domain with ACM certificate"
  type        = bool
  default     = false
}
