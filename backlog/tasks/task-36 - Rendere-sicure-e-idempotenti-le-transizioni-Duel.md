---
id: TASK-36
title: Rendere sicure e idempotenti le transizioni Duel
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m4-duel
  - backend
  - security
  - testing
dependencies:
  - TASK-35
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idempotenza per join, submit e complete; blocco modifica risposte; protezione da replay e reveal anticipato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Retry non duplica partecipanti o risposte
- [ ] #2 Risposte immutabili dopo comparison unlock
- [ ] #3 Opponent answers restano nascoste fino al completamento richiesto
<!-- AC:END -->
