---
id: TASK-367
title: >-
  Rimuovere i GSI ActionTypeIndex inutilizzati su user-analytics e
  product-events
status: In Progress
assignee: []
created_date: '2026-09-30 12:43'
updated_date: '2026-09-30 13:17'
labels:
  - cost
  - aws
  - database
  - analytics
dependencies: []
priority: low
ordinal: 268000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Misura 2026-09-30 (TASK-365): a settembre ActionTypeIndex ha avuto 0 letture su entrambe le tabelle, ma ha replicato ogni scrittura (10.9k WRU su user-analytics, 14.1k su product-events, ~11% delle scritture on-demand DynamoDB, piu' lo storage). Nessun chiamante nel codice (backend/src, scripts): compare solo in un esempio CLI manuale in ANALYTICS_GUIDE.md. Risparmio piccolo (~USD 0,02/mese oggi) ma proporzionale al traffico e senza alcun uso. Prima di rimuovere, verificare che nessuna skill o workflow (.claude/, .github/) o script esterno lo interroghi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Verificato che nessun chiamante (codice, skill, workflow, ANALYTICS_GUIDE) usa ActionTypeIndex, o l'esempio in ANALYTICS_GUIDE viene aggiornato
- [x] #2 I due GSI sono rimossi da backend/terraform/main.tf e l'attributo actionType resta solo se ancora necessario
- [x] #3 doc-1 aggiornato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nessun chiamante di ActionTypeIndex in backend/src, scripts, .claude, .github (grep sull'intero repo): solo l'esempio CLI in ANALYTICS_GUIDE.md, ora riscritto su DayIndex. Rimossi i due GSI e l'attributo actionType dalle definizioni di user_analytics e product_events (non era chiave di nient'altro). terraform validate ok. ADR-155.
<!-- SECTION:NOTES:END -->
