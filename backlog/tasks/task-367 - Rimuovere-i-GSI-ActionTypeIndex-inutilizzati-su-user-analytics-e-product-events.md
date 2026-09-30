---
id: TASK-367
title: >-
  Rimuovere i GSI ActionTypeIndex inutilizzati su user-analytics e
  product-events
status: Backlog
assignee: []
created_date: '2026-09-30 12:43'
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
- [ ] #1 Verificato che nessun chiamante (codice, skill, workflow, ANALYTICS_GUIDE) usa ActionTypeIndex, o l'esempio in ANALYTICS_GUIDE viene aggiornato
- [ ] #2 I due GSI sono rimossi da backend/terraform/main.tf e l'attributo actionType resta solo se ancora necessario
- [ ] #3 doc-1 aggiornato
<!-- AC:END -->
