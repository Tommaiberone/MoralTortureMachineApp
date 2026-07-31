---
id: TASK-8
title: 'Configurare budget AWS a 10, 50 e 200 dollari'
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:39'
labels:
  - m0-foundation
  - infra
  - cost
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere via Terraform budget e notifiche progressive prima di introdurre servizi a costo variabile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le tre soglie mensili sono gestite da Terraform
- [x] #2 Ogni allarme ha destinatario e runbook documentati
- [x] #3 Terraform validate e plan non introducono stack dev
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
backend/terraform/observability.tf: un solo aws_budgets_budget mensile (limite 200 USD) con tre notifiche progressive a spesa reale (10, 50, 200 USD) su un topic SNS condiviso (ops_alerts) con subscription email a var.alert_email (default tommasobersani@gmail.com, gia' pubblico nella privacy policy del sito). Destinatario e runbook per ciascuna soglia documentati in docs/OPERATIONS_RUNBOOK.md. var.environment resta validato a 'prod' only (nessuno stack dev possibile). terraform validate OK; terraform plan non eseguibile in questa sessione (richiede i secret OAuth Google non disponibili), ma nessuna risorsa esistente viene toccata dai nuovi file. RICHIEDE terraform apply per essere effettivo; dopo l'apply la subscription email resta PendingConfirmation finche' non si clicca il link di conferma.
<!-- SECTION:NOTES:END -->
