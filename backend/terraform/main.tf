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

# Idempotent product analytics events. This table replaces client-side funnel
# events in the legacy session/timestamp table while the server endpoint events
# continue to run during migration.
resource "aws_dynamodb_table" "product_events" {
  name         = "${var.environment}-${var.stack_name}-product-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "anonymousUserId"
    type = "S"
  }

  attribute {
    name = "actionType"
    type = "S"
  }

  attribute {
    name = "occurredAt"
    type = "N"
  }

  global_secondary_index {
    name            = "AnonymousUserIndex"
    hash_key        = "anonymousUserId"
    range_key       = "occurredAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "ActionTypeIndex"
    hash_key        = "actionType"
    range_key       = "occurredAt"
    projection_type = "KEYS_ONLY"
  }

  ttl {
    attribute_name = "expirationTime"
    enabled        = true
  }

  tags = {
    Name        = "Moral Torture Machine Product Events"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Idempotent product funnel and referral analytics"
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

# DynamoDB Table for authenticated Users, keyed by immutable Cognito sub.
# TASK-12: unlike the legacy PAY_PER_REQUEST tables (audited exception pending
# TASK-88), this new low-traffic table uses provisioned capacity within the
# always-free 25 RCU/25 WCU account allowance. PITR is left disabled by
# default pending the per-domain retention decision in TASK-89, rather than
# copying the existing tables' enabled-everywhere default.
resource "aws_dynamodb_table" "users" {
  name           = "${var.environment}-${var.stack_name}-users"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "sub"

  attribute {
    name = "sub"
    type = "S"
  }

  tags = {
    Name        = "Moral Torture Machine Users"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Authenticated user records keyed by immutable Cognito sub"
  }
}

# TASK-28: persistent, shareable moral profiles. Owner is the anonymous_user_id
# (anonymous-first, per ADR-002), not the Cognito sub, so a profile can exist
# before any login. No TTL: profiles are core shareable product content, not
# ephemeral analytics; retention is revisited by the per-domain policy in
# TASK-64. Provisioned capacity within the shared Free Tier, no PITR by
# default, matching the TASK-12 Users table precedent.
resource "aws_dynamodb_table" "moral_profiles" {
  name           = "${var.environment}-${var.stack_name}-moral-profiles"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "publicId"

  attribute {
    name = "publicId"
    type = "S"
  }

  attribute {
    name = "ownerAnonymousUserId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  global_secondary_index {
    name            = "OwnerIndex"
    hash_key        = "ownerAnonymousUserId"
    range_key       = "createdAt"
    projection_type = "ALL"
    read_capacity   = 1
    write_capacity  = 1
  }

  tags = {
    Name        = "Moral Torture Machine Moral Profiles"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Persistent shareable moral archetype profiles keyed by a non-enumerable publicId"
  }
}

# TASK-34: a Moral Duel challenge. challengeToken is a non-enumerable random
# token (never the DB key of anything guessable). TTL removes abandoned
# challenges that nobody ever joined/completed.
resource "aws_dynamodb_table" "challenges" {
  name           = "${var.environment}-${var.stack_name}-challenges"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "challengeToken"

  attribute {
    name = "challengeToken"
    type = "S"
  }

  ttl {
    attribute_name = "expirationTime"
    enabled        = true
  }

  tags = {
    Name        = "Moral Torture Machine Challenges"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Moral Duel challenge state with TTL for abandoned challenges"
  }
}

# TASK-34: one row per participant (creator/invitee) per challenge. Answers
# and the derived profile are only attached once a participant submits, and
# are never returned to the other participant before the challenge is
# completed (enforced in application code, not by this schema).
resource "aws_dynamodb_table" "challenge_participants" {
  name           = "${var.environment}-${var.stack_name}-challenge-participants"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "challengeToken"
  range_key      = "role"

  attribute {
    name = "challengeToken"
    type = "S"
  }

  attribute {
    name = "role"
    type = "S"
  }

  ttl {
    attribute_name = "expirationTime"
    enabled        = true
  }

  tags = {
    Name        = "Moral Torture Machine Challenge Participants"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Per-participant Moral Duel state where role is creator or invitee"
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

# Preserve the existing Standard SecureString value without exposing it or using
# it for authorization. The physical name is retained to avoid replacing the
# live secret during this authentication migration.
moved {
  from = aws_ssm_parameter.analytics_admin_key
  to   = aws_ssm_parameter.analytics_fingerprint_pepper
}

resource "aws_ssm_parameter" "analytics_fingerprint_pepper" {
  name        = "/${var.environment}/${var.stack_name}/analytics-admin-key"
  description = "Internal HMAC pepper for analytics network pseudonyms"
  type        = "SecureString"
  value       = "MANAGED_OUT_OF_BAND"

  tags = {
    Name        = "Moral Torture Machine Analytics Fingerprint Pepper"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [value]
  }
}

# Production-only authentication. Google is the only end-user sign-in method;
# web and Android use separate public app clients with authorization-code flow
# and PKCE.
resource "aws_cognito_user_pool" "users" {
  name                     = "${var.environment}-${var.stack_name}-users"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"
  deletion_protection      = "ACTIVE"
  user_pool_tier           = "ESSENTIALS"

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "email"
    required            = true

    string_attribute_constraints {
      min_length = 5
      max_length = 320
    }
  }

  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "name"
    required            = false

    string_attribute_constraints {
      min_length = 1
      max_length = 120
    }
  }

  tags = {
    Name        = "Moral Torture Machine Users"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Progressive web and native authentication"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.users.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "openid email profile"
    client_id        = var.google_oauth_client_id
    client_secret    = var.google_oauth_client_secret
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name                                 = "${var.environment}-${var.stack_name}-web"
  user_pool_id                         = aws_cognito_user_pool.users.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = [aws_cognito_identity_provider.google.provider_name]
  callback_urls = [
    "https://moraltorturemachine.com/auth/callback",
    "https://www.moraltorturemachine.com/auth/callback",
    "http://localhost:5173/auth/callback"
  ]
  logout_urls = [
    "https://moraltorturemachine.com/",
    "https://www.moraltorturemachine.com/",
    "http://localhost:5173/"
  ]
  default_redirect_uri          = "https://moraltorturemachine.com/auth/callback"
  access_token_validity         = 1
  id_token_validity             = 1
  refresh_token_validity        = 30
  enable_token_revocation       = true
  prevent_user_existence_errors = "ENABLED"
  explicit_auth_flows           = ["ALLOW_REFRESH_TOKEN_AUTH"]
  read_attributes               = ["email", "email_verified", "name"]
  write_attributes              = ["email", "name"]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_client" "android" {
  name                                 = "${var.environment}-${var.stack_name}-android"
  user_pool_id                         = aws_cognito_user_pool.users.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = [aws_cognito_identity_provider.google.provider_name]
  callback_urls                        = ["moraltorturemachine://auth/callback"]
  logout_urls                          = ["moraltorturemachine://auth/logout"]
  default_redirect_uri                 = "moraltorturemachine://auth/callback"
  access_token_validity                = 1
  id_token_validity                    = 1
  refresh_token_validity               = 30
  enable_token_revocation              = true
  prevent_user_existence_errors        = "ENABLED"
  explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH"]
  read_attributes                      = ["email", "email_verified", "name"]
  write_attributes                     = ["email", "name"]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "auth" {
  domain                = "moral-torture-machine-${data.aws_caller_identity.current.account_id}"
  user_pool_id          = aws_cognito_user_pool.users.id
  managed_login_version = 2
}

resource "aws_cognito_user_group" "admins" {
  name         = "admins"
  user_pool_id = aws_cognito_user_pool.users.id
  description  = "Moral Torture Machine administrators"
  precedence   = 1
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
          "dynamodb:BatchGetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.dilemmas.arn,
          aws_dynamodb_table.user_analytics.arn,
          "${aws_dynamodb_table.user_analytics.arn}/index/*",
          aws_dynamodb_table.product_events.arn,
          "${aws_dynamodb_table.product_events.arn}/index/*",
          aws_dynamodb_table.story_flows.arn,
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.moral_profiles.arn,
          "${aws_dynamodb_table.moral_profiles.arn}/index/*",
          aws_dynamodb_table.challenges.arn,
          aws_dynamodb_table.challenge_participants.arn
        ]
      },
      {
        Effect = "Allow"
        Action = ["dynamodb:DescribeTable"]
        Resource = [
          aws_dynamodb_table.dilemmas.arn,
          aws_dynamodb_table.user_analytics.arn,
          aws_dynamodb_table.product_events.arn,
          aws_dynamodb_table.story_flows.arn,
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.moral_profiles.arn,
          aws_dynamodb_table.challenges.arn,
          aws_dynamodb_table.challenge_participants.arn
        ]
      },
      {
        Effect = "Allow"
        Action = ["ssm:GetParameter"]
        Resource = [
          aws_ssm_parameter.groq_api_key.arn,
          aws_ssm_parameter.analytics_fingerprint_pepper.arn
        ]
      },
      {
        # TASK-104: the API emails the existing ops_alerts topic on every
        # 4xx/5xx response, reusing the same topic the CloudWatch alarms and
        # budget notifications already post to (ADR-031).
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.ops_alerts.arn]
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
      DYNAMODB_TABLE                          = aws_dynamodb_table.dilemmas.name
      ANALYTICS_TABLE                         = aws_dynamodb_table.user_analytics.name
      STORY_FLOWS_TABLE                       = aws_dynamodb_table.story_flows.name
      PRODUCT_EVENTS_TABLE                    = aws_dynamodb_table.product_events.name
      USERS_TABLE                             = aws_dynamodb_table.users.name
      MORAL_PROFILES_TABLE                    = aws_dynamodb_table.moral_profiles.name
      CHALLENGES_TABLE                        = aws_dynamodb_table.challenges.name
      CHALLENGE_PARTICIPANTS_TABLE            = aws_dynamodb_table.challenge_participants.name
      GROQ_API_KEY_SSM_NAME                   = aws_ssm_parameter.groq_api_key.name
      ANALYTICS_FINGERPRINT_SECRET_SSM_NAME   = aws_ssm_parameter.analytics_fingerprint_pepper.name
      COGNITO_USER_POOL_ID                    = aws_cognito_user_pool.users.id
      COGNITO_APP_CLIENT_ID                   = aws_cognito_user_pool_client.web.id
      COGNITO_APP_CLIENT_IDS                  = join(",", [aws_cognito_user_pool_client.web.id, aws_cognito_user_pool_client.android.id])
      ABUSE_BURST_GUARD_ENABLED               = tostring(var.abuse_burst_guard_enabled)
      ABUSE_GLOBAL_REQUESTS_PER_MINUTE        = tostring(var.abuse_global_requests_per_minute)
      ABUSE_AI_REQUESTS_PER_MINUTE            = tostring(var.abuse_ai_requests_per_minute)
      ABUSE_ANALYTICS_BATCHES_PER_MINUTE      = tostring(var.abuse_analytics_batches_per_minute)
      ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE    = tostring(var.abuse_auth_write_requests_per_minute)
      ABUSE_DUEL_WRITE_REQUESTS_PER_MINUTE    = tostring(var.abuse_duel_write_requests_per_minute)
      ABUSE_PUBLIC_READ_REQUESTS_PER_MINUTE   = tostring(var.abuse_public_read_requests_per_minute)
      OPS_ALERTS_TOPIC_ARN                    = aws_sns_topic.ops_alerts.arn
      OPS_ERROR_NOTIFICATIONS_ENABLED         = tostring(var.ops_error_notifications_enabled)
      OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS = tostring(var.ops_error_notification_cooldown_seconds)
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
      path           = "$context.path"
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
