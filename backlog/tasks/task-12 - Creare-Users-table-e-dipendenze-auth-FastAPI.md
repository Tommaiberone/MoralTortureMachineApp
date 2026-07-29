---
id: TASK-12
title: Creare Users table e dipendenze auth FastAPI
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m1-auth
  - auth
  - backend
  - database
dependencies:
  - TASK-11
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Persistenza utenti keyed by Cognito sub e dipendenze FastAPI per autenticazione opzionale e obbligatoria.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users usa Cognito sub immutabile come chiave
- [ ] #2 Endpoint anonimi continuano a funzionare senza token
- [ ] #3 Endpoint protetti distinguono 401 e 403 correttamente
<!-- AC:END -->
