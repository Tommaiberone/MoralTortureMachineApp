---
id: TASK-89
title: Decidere PITR DynamoDB per dominio dati
status: Open Points
assignee: []
created_date: '2026-07-29 11:55'
labels:
  - cost
  - aws
  - database
  - recovery
dependencies: []
references:
  - 'https://aws.amazon.com/dynamodb/pricing/'
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PITR è attivo su dilemmas, user-analytics e story-flows ed è fatturato per dimensione senza free tier. Stabilire RPO/RTO e criticità per dominio, disabilitandolo dove i dati sono ricostruibili o accettando esplicitamente il costo dove la protezione è necessaria.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni tabella ha classificazione di criticità e RPO/RTO
- [ ] #2 Il costo PITR corrente e previsto è stimato
- [ ] #3 Ogni eccezione a pagamento ha approvazione e owner
- [ ] #4 Terraform riflette la policy decisa e viene validato prima dell'apply
<!-- AC:END -->
