---
id: TASK-13
title: Implementare claim idempotente dei dati anonimi
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m1-auth
  - auth
  - backend
  - database
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere POST /users/claim-anonymous-data e collegare in modo sicuro attività e risultati anonimi all'account.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ripetere il claim non duplica né perde dati
- [ ] #2 Il client non invia email come identificatore
- [ ] #3 Conflitti tra dispositivi hanno comportamento testato
<!-- AC:END -->
