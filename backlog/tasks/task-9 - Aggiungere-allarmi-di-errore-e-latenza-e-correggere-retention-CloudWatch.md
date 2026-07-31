---
id: TASK-9
title: Aggiungere allarmi di errore e latenza e correggere retention CloudWatch
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:39'
labels:
  - m0-foundation
  - infra
  - observability
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allarmare errori e latenza API/Lambda e rendere effettivi i sette giorni di retention dei log di produzione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Log group di produzione con retention effettiva di sette giorni
- [x] #2 Allarmi coprono error rate e latenza anomala
- [x] #3 Le soglie evitano rumore inutile al traffico attuale
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1 gia' soddisfatta in produzione: verificato via AWS CLI (profilo personal, sola lettura) che entrambi i log group (/aws/lambda/moral-torture-machine-api e /aws/apigateway/moral-torture-machine-api) hanno gia' retention=7 giorni effettiva, non solo dichiarata in Terraform. AC2: aggiunti 4 allarmi CloudWatch in backend/terraform/observability.tf (lambda-errors, lambda-latency, api-5xx, api-latency), tutti su SNS ops_alerts condiviso con TASK-8. AC3: soglie assolute (>=5 eventi/15min per errori, >=5s medi per latenza) invece di rate percentuali, scelte apposta per evitare falsi positivi da piccolo denominatore al traffico attuale (~25k invocazioni/mese, ~50ms medi per doc-1); treat_missing_data=notBreaching cosi' i periodi silenziosi non generano allarmi. Runbook con destinatario e passi di prima risposta per ciascun allarme in docs/OPERATIONS_RUNBOOK.md. terraform validate OK. RICHIEDE terraform apply per essere effettivo.
<!-- SECTION:NOTES:END -->
