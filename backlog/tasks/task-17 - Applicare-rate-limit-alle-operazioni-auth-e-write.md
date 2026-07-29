---
id: TASK-17
title: Applicare rate limit alle operazioni auth e write
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m1-auth
  - security
  - backend
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Limitare operazioni adiacenti al signup e scritture autenticate con risposte e retry sicuri.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Le soglie sono configurabili e documentate
- [ ] #2 Le risposte 429 includono retry coerente
- [ ] #3 Letture pubbliche normali non vengono penalizzate
<!-- AC:END -->
