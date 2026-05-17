terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source to get current AWS account
data "aws_caller_identity" "current" {}

# DynamoDB Table for Dilemmas
resource "aws_dynamodb_table" "dilemmas" {
  name         = "${var.environment}-${var.stack_name}-dilemmas"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "_id"

  attribute {
    name = "_id"
    type = "S"
  }

  # Enable Point-in-Time Recovery for automatic backups
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Moral Torture Machine Dilemmas"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# DynamoDB Table for User Analytics
resource "aws_dynamodb_table" "user_analytics" {
  name         = "${var.environment}-${var.stack_name}-user-analytics"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"
  range_key    = "timestamp"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "actionType"
    type = "S"
  }

  # Global Secondary Index to query by action type across all sessions
  global_secondary_index {
    name            = "ActionTypeIndex"
    hash_key        = "actionType"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Enable TTL to automatically delete old events after 90 days
  ttl {
    attribute_name = "expirationTime"
    enabled        = true
  }

  # Enable Point-in-Time Recovery for automatic backups
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Moral Torture Machine User Analytics"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Track user behavior and interactions for analytics"
  }
}

# DynamoDB Table for Story Flows
resource "aws_dynamodb_table" "story_flows" {
  name         = "${var.environment}-${var.stack_name}-story-flows"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "_id"

  attribute {
    name = "_id"
    type = "S"
  }

  # Enable Point-in-Time Recovery for automatic backups
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "Moral Torture Machine Story Flows"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Story mode with branching dilemma flows"
  }
}

# SSM Parameter for Groq API Key (migrato da Secrets Manager - risparmio $0.40/mese)
# Se già creato via CLI, importare con:
# terraform import aws_ssm_parameter.groq_api_key /prod/moral-torture-machine/groq-api-key
resource "aws_ssm_parameter" "groq_api_key" {
  name        = "/${var.environment}/${var.stack_name}/groq-api-key"
  description = "Groq API Key for AI-generated dilemmas"
  type        = "SecureString"
  value       = var.groq_api_key

  tags = {
    Name        = "Moral Torture Machine Groq API Key"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [value]
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.stack_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Name        = "Moral Torture Machine Lambda Role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.dilemmas.arn,
          aws_dynamodb_table.user_analytics.arn,
          "${aws_dynamodb_table.user_analytics.arn}/index/*",
          aws_dynamodb_table.story_flows.arn
        ]
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:DescribeTable"]
        Resource = [
          aws_dynamodb_table.dilemmas.arn,
          aws_dynamodb_table.user_analytics.arn,
          aws_dynamodb_table.story_flows.arn
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter"]
        Resource = aws_ssm_parameter.groq_api_key.arn
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.stack_name}-api"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Moral Torture Machine Lambda Logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Lambda Function
resource "aws_lambda_function" "api" {
  function_name    = "${var.stack_name}-api"
  filename         = "${path.module}/../lambda_function.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda_function.zip")
  handler          = "backend_fastapi.handler"
  runtime          = "python3.11"
  role             = aws_iam_role.lambda_role.arn
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE        = aws_dynamodb_table.dilemmas.name
      ANALYTICS_TABLE       = aws_dynamodb_table.user_analytics.name
      STORY_FLOWS_TABLE     = aws_dynamodb_table.story_flows.name
      GROQ_API_KEY_SSM_NAME = aws_ssm_parameter.groq_api_key.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = {
    Name        = "Moral Torture Machine API"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.stack_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["*"]
    allow_methods     = ["*"]
    allow_origins     = var.cors_allowed_origins
    max_age           = 0
  }

  tags = {
    Name        = "Moral Torture Machine API Gateway"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.api.name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "Moral Torture Machine API Gateway Logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      httpMethod     = "$context.httpMethod"
      ip             = "$context.identity.sourceIp"
      protocol       = "$context.protocol"
      requestId      = "$context.requestId"
      requestTime    = "$context.requestTime"
      responseLength = "$context.responseLength"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
    })
  }

  tags = {
    Name        = "Moral Torture Machine API Stage"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# API Gateway Lambda Integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 30000
}

# API Gateway Catch-all Route
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "allow-api-gateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# Null resource to populate DynamoDB with dilemmas
resource "null_resource" "populate_dynamodb" {
  count = var.populate_db ? 1 : 0

  triggers = {
    dilemmas_data = filemd5("${path.module}/../data/dilemmas_it.json")
    table_name    = aws_dynamodb_table.dilemmas.name
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      python3 -m pip install -q boto3
      python3 scripts/populate_dynamodb_multilang.py ${aws_dynamodb_table.dilemmas.name}
    EOT
  }

  depends_on = [aws_dynamodb_table.dilemmas]
}
