# Terraform state backend configuration
# This stores the state in S3 so it can be shared between local and GitHub Actions

terraform {
  backend "s3" {
    bucket = "moral-torture-machine-terraform-state"
    key    = "terraform.tfstate"
    region = "eu-west-1"

    # Enable state locking using DynamoDB
    dynamodb_table = "moral-torture-machine-terraform-locks"
    encrypt        = true
  }
}
