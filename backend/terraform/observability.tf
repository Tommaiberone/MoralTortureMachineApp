# TASK-8 / TASK-9: cost guardrails and operational alarms.
# Recipient and response steps for every notification below are documented in
# docs/OPERATIONS_RUNBOOK.md, per the Mandatory AWS Free Tier / cost rules in
# CLAUDE.md ("every new variable-cost service needs an owner, budget alarm,
# and fallback").

resource "aws_sns_topic" "ops_alerts" {
  name = "${var.environment}-${var.stack_name}-ops-alerts"

  tags = {
    Name        = "Moral Torture Machine Ops Alerts"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_sns_topic_subscription" "ops_alerts_email" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# TASK-8: one monthly cost budget with three progressive absolute-dollar
# notifications (10, 50, 200 USD) rather than three separate budgets, since
# they represent escalating checkpoints on the same monthly spend.
resource "aws_budgets_budget" "monthly_cost" {
  name         = "${var.environment}-${var.stack_name}-monthly-cost"
  budget_type  = "COST"
  limit_amount = "200"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 10
    threshold_type             = "ABSOLUTE_VALUE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "ABSOLUTE_VALUE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

# TASK-9: error and latency alarms sized for current low-volume traffic
# (doc-1 baseline: ~25k monthly Lambda invocations, ~50 ms average duration).
# Absolute-count thresholds (rather than a raw error *rate*) avoid noise from
# the small-denominator problem at this traffic level; missing data is never
# treated as a breach so quiet periods don't page anyone.
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.environment}-${var.stack_name}-lambda-errors"
  alarm_description   = "Lambda errors >= 5 in 15 minutes. See docs/OPERATIONS_RUNBOOK.md."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.api.function_name }
  statistic           = "Sum"
  period              = 900
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  tags = {
    Name        = "Moral Torture Machine Lambda Errors"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_latency" {
  alarm_name          = "${var.environment}-${var.stack_name}-lambda-latency"
  alarm_description   = "Lambda average duration >= 5s in 15 minutes (typical is ~50ms). See docs/OPERATIONS_RUNBOOK.md."
  namespace           = "AWS/Lambda"
  metric_name         = "Duration"
  dimensions          = { FunctionName = aws_lambda_function.api.function_name }
  statistic           = "Average"
  period              = 900
  evaluation_periods  = 1
  threshold           = 5000
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  tags = {
    Name        = "Moral Torture Machine Lambda Latency"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${var.environment}-${var.stack_name}-api-5xx"
  alarm_description   = "API Gateway 5xx responses >= 5 in 15 minutes. See docs/OPERATIONS_RUNBOOK.md."
  namespace           = "AWS/ApiGateway"
  metric_name         = "5xx"
  dimensions          = { ApiId = aws_apigatewayv2_api.api.id, Stage = aws_apigatewayv2_stage.default.name }
  statistic           = "Sum"
  period              = 900
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  tags = {
    Name        = "Moral Torture Machine API Gateway 5xx"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "${var.environment}-${var.stack_name}-api-latency"
  alarm_description   = "API Gateway average latency >= 5s in 15 minutes. See docs/OPERATIONS_RUNBOOK.md."
  namespace           = "AWS/ApiGateway"
  metric_name         = "Latency"
  dimensions          = { ApiId = aws_apigatewayv2_api.api.id, Stage = aws_apigatewayv2_stage.default.name }
  statistic           = "Average"
  period              = 900
  evaluation_periods  = 1
  threshold           = 5000
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  ok_actions          = [aws_sns_topic.ops_alerts.arn]

  tags = {
    Name        = "Moral Torture Machine API Gateway Latency"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
