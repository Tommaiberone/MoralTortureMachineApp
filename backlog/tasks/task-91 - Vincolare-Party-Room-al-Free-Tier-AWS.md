---
id: TASK-91
title: Vincolare Party Room al Free Tier AWS
status: Backlog
assignee: []
created_date: '2026-07-29 11:55'
labels:
  - cost
  - aws
  - websocket
  - m6-party
dependencies:
  - TASK-37
references:
  - backlog/tasks/task-46 - Creare-backend-Party-Room-realtime.md
  - 'https://aws.amazon.com/api-gateway/pricing/'
documentation:
  - backlog/docs/doc-1
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prima di TASK-46 confrontare API Gateway WebSocket, polling HTTP e alternative AWS con free tier. Il free tier API Gateway WebSocket è limitato ai primi 12 mesi per i nuovi account, quindi non va assunto come gratuito sul profilo personal.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eleggibilità reale dell'account e prezzi correnti sono verificati su fonti AWS ufficiali
- [ ] #2 Costo per room e limiti di messaggi e connection-minutes sono stimati
- [ ] #3 È scelta una soluzione tecnicamente adeguata con free tier oppure viene chiesta un'eccezione esplicita
- [ ] #4 TTL, idle close, budget e kill switch sono definiti prima del provisioning
<!-- AC:END -->
