output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.dilemmas.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.dilemmas.arn
}

output "analytics_table_name" {
  description = "Name of the User Analytics DynamoDB table"
  value       = aws_dynamodb_table.user_analytics.name
}

output "analytics_table_arn" {
  description = "ARN of the User Analytics DynamoDB table"
  value       = aws_dynamodb_table.user_analytics.arn
}

output "product_events_table_name" {
  description = "Name of the idempotent product events table"
  value       = aws_dynamodb_table.product_events.name
}

output "product_events_table_arn" {
  description = "ARN of the idempotent product events table"
  value       = aws_dynamodb_table.product_events.arn
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "ssm_parameter_name" {
  description = "SSM Parameter Store path for Groq API key"
  value       = aws_ssm_parameter.groq_api_key.name
}

output "analytics_admin_key_ssm_parameter_name" {
  description = "SSM Parameter Store path for the analytics dashboard key"
  value       = aws_ssm_parameter.analytics_admin_key.name
}

output "cognito_user_pool_id" {
  description = "Production Cognito User Pool ID"
  value       = aws_cognito_user_pool.users.id
}

output "cognito_web_client_id" {
  description = "Public Cognito app client ID for the web application"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_android_client_id" {
  description = "Public Cognito app client ID for the Android application"
  value       = aws_cognito_user_pool_client.android.id
}

output "cognito_domain" {
  description = "Cognito managed-login base URL"
  value       = "https://${aws_cognito_user_pool_domain.auth.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "google_oauth_redirect_uri" {
  description = "Authorized redirect URI to configure in Google Cloud Console"
  value       = "https://${aws_cognito_user_pool_domain.auth.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}
