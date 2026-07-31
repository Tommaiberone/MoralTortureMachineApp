# Operations runbook

Recipient for every notification below: `tommasobersani@gmail.com` (the
`alert_email` Terraform variable in `backend/terraform/variables.tf`), the
sole owner/operator of this project. All alarms and budget notifications
share one SNS topic, `aws_sns_topic.ops_alerts` (`backend/terraform/observability.tf`).

After `terraform apply`, the email subscription is created in
`PendingConfirmation` state — AWS sends a confirmation link that must be
clicked once before notifications are actually delivered.

## Budget notifications (TASK-8)

One monthly AWS Cost Budget (`monthly_cost`), limit $200/month, with three
progressive notifications at actual spend:

| Threshold | Meaning |
|---|---|
| $10 | Early signal. Check the Cost Explorer breakdown by service; confirm nothing unexpected started billing (e.g. a Free Tier boundary was crossed). No action usually required beyond noting it. |
| $50 | Investigate. Identify the specific service/resource driving spend. Compare against the AWS Free Tier audit snapshot in `backlog/docs/doc-1`; if a genuinely new variable-cost service is involved, it should already have an approved exception recorded in the ADR log. |
| $200 (100% of budget) | Stop and decide. Do not let spend continue unchecked past this point — identify the driver and either turn it off, reduce it, or explicitly approve continuing per the CLAUDE.md cost-exception process (cost, alternative, owner, kill switch, ADR entry). |

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
