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

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}
