---
id: TASK-88
title: Valutare migrazione DynamoDB al Free Tier provisioned
status: Open Points
assignee: []
created_date: '2026-07-29 11:55'
labels:
  - cost
  - aws
  - database
  - terraform
dependencies: []
references:
  - 'https://aws.amazon.com/dynamodb/pricing/'
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Le tabelle Moral Torture Machine e i lock Terraform sono PAY_PER_REQUEST, mentre il free tier delle richieste DynamoDB usa capacità provisioned Standard. L'account usa attualmente 0 delle 25 RCU/WCU gratuite in eu-west-1. Decidere l'allocazione senza introdurre throttling prima di cambiare Terraform.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Picchi di lettura e scrittura sono misurati per tabelle e GSI
- [ ] #2 Il piano resta entro le 25 RCU e 25 WCU condivise oppure documenta costo ed eccezione approvata
- [ ] #3 Allarmi di throttling e rollback a on-demand sono definiti
- [ ] #4 La decisione precede qualsiasi modifica al database di produzione
<!-- AC:END -->
