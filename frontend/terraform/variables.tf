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
