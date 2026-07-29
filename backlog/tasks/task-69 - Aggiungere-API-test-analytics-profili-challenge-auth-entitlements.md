---
id: TASK-69
title: Aggiungere API test analytics profili challenge auth entitlements
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m10-quality
  - testing
  - api
dependencies:
  - TASK-28
  - TASK-35
  - TASK-53
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coprire happy path, auth, idempotenza, validazione e failure/retry per le API core man mano che arrivano.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni API core ha test autorizzazione e schema
- [ ] #2 Retry e idempotenza sono coperti
- [ ] #3 Test non usano risorse AWS prod
<!-- AC:END -->
