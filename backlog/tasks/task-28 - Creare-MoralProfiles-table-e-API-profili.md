---
id: TASK-28
title: Creare MoralProfiles table e API profili
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-29 11:57'
labels:
  - m3-profiles
  - backend
  - database
  - privacy
dependencies:
  - TASK-13
  - TASK-26
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Salvare owner, archetipo, score, percentili, lingua, versione algoritmo, visibilità e policy di scadenza; esporre create e get pubblico.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Public ID è non enumerabile
- [ ] #2 La response pubblica esclude attributi privati
- [ ] #3 Billing mode segue ADR-011 e TASK-88; TTL e retention sono definite
<!-- AC:END -->
