terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source to get current AWS account
data "aws_caller_identity" "current" {}

# DynamoDB Table
resource "aws_dynamodb_table" "dilemmas" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "_id"

  attribute {
    name = "_id"
    type = "S"
  }

  tags = {
    Name        = "Moral Torture Machine Dilemmas"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.stack_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "Moral Torture Machine Lambda Role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Attach Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB access policy
resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ]
      Resource = aws_dynamodb_table.dilemmas.arn
    }]
  })
}

# Null resource to build Lambda package
resource "null_resource" "lambda_package" {
  triggers = {
    # Rebuild when these files change
    backend_code    = filemd5("${path.module}/../backend_fastapi.py")
    requirements    = filemd5("${path.module}/../requirements.txt")
    always_rebuild  = var.force_rebuild ? timestamp() : ""
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      rm -rf lambda_deployment lambda_function.zip
      mkdir -p lambda_deployment
      cp backend_fastapi.py lambda_deployment/
      pip install -q -r requirements.txt -t lambda_deployment/ --platform manylinux2014_x86_64 --only-binary=:all:
      cd lambda_deployment
      zip -q -r ../lambda_function.zip .
    EOT
  }
}

# Archive data source for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda_deployment"
  output_path = "${path.module}/../lambda_function.zip"

  depends_on = [null_resource.lambda_package]
}

# Lambda Function
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.stack_name}-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "backend_fastapi.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.dilemmas.name
      AWS_REGION     = var.aws_region
      API_KEY        = var.groq_api_key
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.dynamodb_policy,
    null_resource.lambda_package
  ]

  tags = {
    Name        = "Moral Torture Machine API"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Moral Torture Machine Lambda Logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.stack_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = var.cors_allowed_origins
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    allow_credentials = true
  }

  tags = {
    Name        = "Moral Torture Machine API Gateway"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# API Gateway Integration with Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Default Route
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "Moral Torture Machine API Stage"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.stack_name}-api"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Moral Torture Machine API Gateway Logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# Null resource to populate DynamoDB with dilemmas
resource "null_resource" "populate_dynamodb" {
  count = var.populate_db ? 1 : 0

  triggers = {
    dilemmas_data = filemd5("${path.module}/../dilemmas.json")
    table_name    = aws_dynamodb_table.dilemmas.name
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      python3 -m pip install -q boto3
      python3 populate_dynamodb.py ${aws_dynamodb_table.dilemmas.name} dilemmas.json
    EOT
  }

  depends_on = [aws_dynamodb_table.dilemmas]
}
