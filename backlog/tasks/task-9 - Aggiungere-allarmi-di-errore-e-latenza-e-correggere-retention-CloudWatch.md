---
id: TASK-9
title: Aggiungere allarmi di errore e latenza e correggere retention CloudWatch
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
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
- [ ] #1 Log group di produzione con retention effettiva di sette giorni
- [ ] #2 Allarmi coprono error rate e latenza anomala
- [ ] #3 Le soglie evitano rumore inutile al traffico attuale
<!-- AC:END -->
