---
id: TASK-46
title: Creare backend Party Room realtime
status: Backlog
assignee: []
created_date: '2026-07-29 11:28'
labels:
  - m6-party
  - backend
  - websocket
  - database
dependencies:
  - TASK-37
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Room code e QR, presenza, stato corrente, timer e voting con WebSocket solo per room attive.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Room code non espone ID interni
- [ ] #2 Connessioni idle vengono chiuse
- [ ] #3 Room abbandonate scadono
<!-- AC:END -->
