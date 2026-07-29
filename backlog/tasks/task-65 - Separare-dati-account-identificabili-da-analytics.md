---
id: TASK-65
title: Separare dati account identificabili da analytics
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m9-privacy
  - privacy
  - analytics
  - backend
dependencies:
  - TASK-12
  - TASK-13
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Impedire join diretti non necessari tra PII account e comportamento, mantenendo misure aggregate e claim sicuro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Event store non contiene email o token
- [ ] #2 Accessi amministrativi seguono least privilege
- [ ] #3 Aggregati non permettono re-identificazione ragionevole
<!-- AC:END -->
