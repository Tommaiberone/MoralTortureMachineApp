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
