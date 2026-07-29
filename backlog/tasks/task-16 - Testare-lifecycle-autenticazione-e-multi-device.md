---
id: TASK-16
title: Testare lifecycle autenticazione e multi-device
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m1-auth
  - auth
  - qa
dependencies:
  - TASK-11
  - TASK-13
  - TASK-15
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coprire refresh, logout, scadenza token, callback fallita, retry e accesso da più dispositivi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Test automatici coprono scadenza e token non validi
- [ ] #2 Logout rimuove la sessione browser
- [ ] #3 Il claim non regredisce su refresh o secondo dispositivo
<!-- AC:END -->
