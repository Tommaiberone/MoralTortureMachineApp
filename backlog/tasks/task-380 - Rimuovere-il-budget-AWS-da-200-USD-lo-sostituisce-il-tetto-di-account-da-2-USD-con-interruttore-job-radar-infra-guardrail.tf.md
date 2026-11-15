---
id: TASK-380
title: >-
  Rimuovere il budget AWS da 200 USD: lo sostituisce il tetto di account da 2
  USD con interruttore (job-radar infra/guardrail.tf)
status: Done
assignee: []
created_date: '2026-11-15 12:57'
updated_date: '2026-11-15 13:14'
labels:
  - infra
  - cost
dependencies: []
priority: high
ordinal: 281000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente il 15/11/2026: 'togli il budget da 200 e metti a 2 euro; non voglio per nessun motivo spendere più di 2 euro e comunque voglio saperlo prima'. Il budget dell'account (tutti i progetti) ora vive nel Terraform di job-radar, con avvisi progressivi e un interruttore automatico che ferma Lambda e API Gateway. Qui si toglie aws_budgets_budget.monthly_cost (TASK-8) e si aggiornano runbook, doc-1 e commenti che citano le soglie 10/50/200.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 aws_budgets_budget.monthly_cost rimosso da backend/terraform/observability.tf, terraform validate passa
- [x] #2 docs/OPERATIONS_RUNBOOK.md, doc-1 e i commenti in main.tf/variables.tf descrivono il nuovo tetto, l'interruttore e come ripristinare
- [x] #3 Dopo il deploy della CI in AWS resta solo il budget di account
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Budget da 200 USD rimosso dalla CI il 15/11/2026 (run 43717283467); in AWS resta solo il budget di account. Il tetto da 2 USD con interruttore è nel repo job-radar (infra/guardrail.tf, commit c6e49d9): finché il suo terraform apply non viene approvato resta attivo il budget di account precedente da 1 USD (solo email). Runbook, doc-1 e commenti aggiornati (ADR-166).
<!-- SECTION:FINAL_SUMMARY:END -->
