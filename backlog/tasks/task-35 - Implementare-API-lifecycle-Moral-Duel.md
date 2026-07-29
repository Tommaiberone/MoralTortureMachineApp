---
id: TASK-35
title: Implementare API lifecycle Moral Duel
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m4-duel
  - backend
  - api
dependencies:
  - TASK-34
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Endpoint create, open, join, submit, complete, compare e rematch con contratti versionati.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni transizione di stato è validata
- [ ] #2 Gli errori expired, revoked e completed sono distinti
- [ ] #3 Il flusso funziona senza login per l'invitato
<!-- AC:END -->
