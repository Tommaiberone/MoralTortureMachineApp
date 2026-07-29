---
id: TASK-73
title: Implementare feature flags e assignment esperimenti persistente
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m10-quality
  - experiments
  - frontend
  - backend
dependencies:
  - TASK-2
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Flag controllabili e assegnazione stabile condivisa con analytics senza creare stack AWS dev.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Assignment persiste tra sessioni secondo identità
- [ ] #2 Eventi includono variante attiva
- [ ] #3 Rollback flag non richiede nuova API incompatibile
<!-- AC:END -->
