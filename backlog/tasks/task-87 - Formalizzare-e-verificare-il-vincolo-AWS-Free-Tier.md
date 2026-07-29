---
id: TASK-87
title: Formalizzare e verificare il vincolo AWS Free Tier
status: Done
assignee: []
created_date: '2026-07-29 11:49'
updated_date: '2026-07-29 11:57'
labels:
  - cost
  - aws
  - architecture
  - documentation
dependencies: []
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rendere obbligatoria la preferenza per servizi AWS con free tier quando esistono e verificare infrastruttura corrente e backlog rispetto al vincolo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLAUDE.md contiene una regola assoluta AWS Free Tier
- [x] #2 Architettura e ADR esplicitano criterio e procedura di eccezione
- [x] #3 Terraform e risorse AWS live sono classificati per compatibilità free tier
- [x] #4 Task futuri potenzialmente a pagamento sono identificati e corretti o segnalati
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Audit 2026-07-29 con AWS CLI --profile personal: costo luglio MTD circa USD 0; quattro tabelle prod, due lock e una legacy sono PAY_PER_REQUEST; PITR attivo su tre tabelle; SSM Standard, log a 7 giorni, Lambda/S3/CloudFront entro uso gratuito corrente. Creati TASK-88, TASK-89, TASK-90 e TASK-91; corretto TASK-28.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Formalizzata la regola AWS Free Tier in CLAUDE.md, architettura e ADR-011. Audit live e backlog documentati; i conflitti DynamoDB sono resi espliciti senza modificare produzione.
<!-- SECTION:FINAL_SUMMARY:END -->
