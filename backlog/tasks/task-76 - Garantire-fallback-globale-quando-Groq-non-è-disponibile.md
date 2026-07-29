---
id: TASK-76
title: Garantire fallback globale quando Groq non è disponibile
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m10-quality
  - ai
  - resilience
  - cost
dependencies:
  - TASK-27
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Auditare tutti i flussi AI e garantire template/cache deterministici in caso di errore o rate limit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessun flusso core fallisce senza Groq
- [ ] #2 Retry ha limiti e backoff
- [ ] #3 Fallback è coperto da test
<!-- AC:END -->
