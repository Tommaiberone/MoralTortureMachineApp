output "api_endpoint" {
  description = "URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.api.id
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.api.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.dilemmas.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.dilemmas.arn
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "lambda_log_group" {
  description = "CloudWatch Log Group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "api_log_group" {
  description = "CloudWatch Log Group for API Gateway"
  value       = aws_cloudwatch_log_group.api_logs.name
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for Groq API key"
  value       = aws_secretsmanager_secret.groq_api_key.arn
  sensitive   = true
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret for Groq API key"
  value       = aws_secretsmanager_secret.groq_api_key.name
}

output "test_commands" {
  description = "Commands to test your API"
  value = {
    health_check    = "curl ${aws_apigatewayv2_api.api.api_endpoint}"
    api_docs        = "curl ${aws_apigatewayv2_api.api.api_endpoint}/docs"
    get_dilemma     = "curl ${aws_apigatewayv2_api.api.api_endpoint}/get-dilemma"
    view_logs       = "aws logs tail ${aws_cloudwatch_log_group.lambda_logs.name} --follow --region ${var.aws_region}"
  }
}

output "deployment_summary" {
  description = "Summary of the deployment"
  value = <<-EOT

    ==========================================
    Deployment Complete!
    ==========================================

    API URL: ${aws_apigatewayv2_api.api.api_endpoint}
    DynamoDB Table: ${aws_dynamodb_table.dilemmas.name}
    Lambda Function: ${aws_lambda_function.api.function_name}
    Secrets Manager: ${aws_secretsmanager_secret.groq_api_key.name}
    Region: ${var.aws_region}

    Security Features Enabled:
      ✓ API key stored in AWS Secrets Manager
      ✓ Rate limiting: 50 requests/second, 100 burst
      ✓ CORS restricted to specific origins
      ✓ Input validation on all endpoints
      ✓ Security headers enabled
      ✓ PII filtering in CloudWatch logs

    Test your API:
      curl ${aws_apigatewayv2_api.api.api_endpoint}
      curl ${aws_apigatewayv2_api.api.api_endpoint}/docs
      curl ${aws_apigatewayv2_api.api.api_endpoint}/get-dilemma

    View logs:
      aws logs tail ${aws_cloudwatch_log_group.lambda_logs.name} --follow --region ${var.aws_region}

    Update API Key:
      aws secretsmanager put-secret-value \
        --secret-id ${aws_secretsmanager_secret.groq_api_key.name} \
        --secret-string "your-new-key" \
        --region ${var.aws_region}

    Cost estimate: ~$0-5/month for moderate usage

  EOT
}
