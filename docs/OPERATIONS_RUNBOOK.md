# Operations runbook

Recipient for every notification below: `tommasobersani@gmail.com` (the
`alert_email` Terraform variable in `backend/terraform/variables.tf`), the
sole owner/operator of this project. This stack's alarms share one SNS topic,
`aws_sns_topic.ops_alerts` (`backend/terraform/observability.tf`).

After `terraform apply`, the email subscription is created in
`PendingConfirmation` state — AWS sends a confirmation link that must be
clicked once before notifications are actually delivered.

## Account cost cap and kill switch (TASK-380, replaces TASK-8)

The user's rule (2026-11-15): never spend more than 2 EUR a month on this AWS
account, and know before it happens. The account also hosts job-radar,
smartchess, ai-autofiller and wa-summarizer, so the guardrail is account-wide
and lives in the job-radar repo (`infra/guardrail.tf`), not here. The 12-month
Free Tier expired at the end of October 2026: the account's normal spend is
now about 0.30 USD a month, almost all of it this project.

| Signal | When | What happens |
|---|---|---|
| Budget `account-monthly` (2 USD; Budgets only works in USD, and 2 USD stays under 2 EUR) | actual > 0.50 USD, > 1.00 USD; forecast > 2 USD | Email. Check Cost Explorer by service and usage type. |
| Alarm `account-lambda-traffic-warning` | > 2,000 Lambda invocations per 15 minutes for an hour (normal peak ~3,300 in one 15-minute slot, ~6,000 in an hour) | Email via the `account-guardrail-alerts` topic. Look at `AWS/ApiGateway` `Count` per `ApiId`, then the Lambda logs. |
| Alarm `account-lambda-traffic-kill` | > 5,000 per 15 minutes for two hours | **Kill switch**, plus an email |
| Budget, actual > 1.50 USD or > 2 USD | (billing data lags by hours) | **Kill switch**, plus an email |

The kill switch (`account-kill-switch` Lambda) sets every Lambda in eu-west-1
and us-east-1 to reserved concurrency 0, disables every API Gateway API's
`execute-api` endpoint (404) and throttles every stage to 0 (429). It first
saves the previous settings to the job-radar state bucket
(`guardrail/kill-switch.json`). To bring everything back, from the job-radar
repo: `bash scripts/kill-switch.sh restore` (`status` shows what is stopped).
A deploy of this stack also undoes it for this stack, because Terraform puts
the Lambda's concurrency and the API's endpoint back to their configured
values.

## Error and latency alarms (TASK-9)

Four CloudWatch alarms, all posting to the same SNS topic, sized for the
project's current low-traffic baseline (~25k monthly Lambda invocations,
~50 ms average duration per the doc-1 Free Tier audit). Missing data is
never treated as a breach, so quiet periods never page anyone.

| Alarm | Fires when | First response |
|---|---|---|
| `lambda-errors` | ≥5 Lambda errors in 15 minutes | Check `/aws/lambda/moral-torture-machine-api` in CloudWatch Logs for the exception; the most recent deploy (`.github/workflows/deploy.yml` run) is the first suspect. |
| `lambda-latency` | Average Lambda duration ≥5s in 15 minutes | Check whether Groq (AI calls) is slow/rate-limited, or DynamoDB is throttling on a provisioned table; the `/health` endpoint reports per-dependency status. |
| `api-5xx` | ≥5 API Gateway 5xx responses in 15 minutes | Almost always downstream of a Lambda error or timeout; check `lambda-errors` first. |
| `api-latency` | Average API Gateway latency ≥5s in 15 minutes | Check `lambda-latency` first; if the Lambda itself is fast, suspect API Gateway or a cold start under load. |

These thresholds are intentionally coarse for a low-traffic solo project;
revisit them (lower the absolute counts, or switch to a rate-based metric
math expression) once monthly invocations grow enough that 5 errors in 15
minutes stops being a meaningful signal.

## Ops error alerts: email + DynamoDB history (TASK-104/129/130)

Every 4xx/5xx API response (including an uncaught exception) both emails the
`ops_alerts` topic above and writes one item to the `ops_error_alerts`
DynamoDB table (`backend/terraform/main.tf`), coalesced to at most one
notification per `(status_code, route signature)` per 600s per warm Lambda
container (ADR-045/059). The table keeps a 30-day TTL history, so an alert
that already scrolled out of the inbox can still be looked up.

To inspect it directly:

```bash
aws --profile personal dynamodb scan --table-name prod-moral-torture-machine-ops-error-alerts
```

Run the `ops-alerts-sweep` skill (`.claude/commands/ops-alerts-sweep.md`,
TASK-130) to triage the table in bulk: it groups alerts by
`(statusCode, pathSignature)`, investigates each group in the code, deletes
the ones it can confidently resolve as noise or already-fixed, and files a
Backlog.md task for anything that still needs a real fix instead of touching
product code itself.
