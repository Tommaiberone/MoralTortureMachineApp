terraform {
  backend "s3" {
    bucket         = "moral-torture-machine-terraform-state"
    key            = "frontend/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}
