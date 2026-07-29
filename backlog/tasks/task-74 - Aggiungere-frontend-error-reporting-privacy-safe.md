---
id: TASK-74
title: Aggiungere frontend error reporting privacy-safe
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m10-quality
  - observability
  - frontend
  - privacy
dependencies:
  - TASK-9
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raccogliere errori e contesto tecnico minimo senza PII, token, risposte o output AI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Payload è filtrato e documentato
- [ ] #2 Errori sono correlabili a release e piattaforma
- [ ] #3 Failure del reporter non impatta UX
<!-- AC:END -->
