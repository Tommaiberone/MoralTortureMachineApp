---
id: TASK-49
title: Load test Party Room da 2 a 20 partecipanti
status: Backlog
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-02 08:31'
labels:
  - m6-party
  - qa
  - cost
  - polling
dependencies:
  - TASK-47
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Misurare 2, 5, 10 e 20 partecipanti con polling HTTP (non WebSocket): frequenza di polling, reconnect, timeout, volume di richieste/costo Lambda+DynamoDB e comportamento a fine room.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenari target completano senza inconsistenza
- [ ] #2 Costo per room è stimato
- [ ] #3 Limiti e allarmi operativi sono documentati
<!-- AC:END -->
