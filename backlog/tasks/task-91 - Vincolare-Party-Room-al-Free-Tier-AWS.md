---
id: TASK-91
title: Vincolare Party Room al Free Tier AWS
status: Done
assignee: []
created_date: '2026-07-29 11:55'
updated_date: '2026-08-02 08:32'
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
- [x] #1 Eleggibilità reale dell'account e prezzi correnti sono verificati su fonti AWS ufficiali
- [ ] #2 Costo per room e limiti di messaggi e connection-minutes sono stimati
- [x] #3 È scelta una soluzione tecnicamente adeguata con free tier oppure viene chiesta un'eccezione esplicita
- [ ] #4 TTL, idle close, budget e kill switch sono definiti prima del provisioning
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Confronto fatto in conversazione con l'utente: invece di API Gateway WebSocket (free tier limitato ai primi 12 mesi per nuovi account, quindi non garantito su un account gia' esistente come quello personal) si usa polling HTTP, lo stesso pattern gia' in produzione per Moral Duel (API Gateway HTTP + Lambda + DynamoDB, gia' interamente dentro il Free Tier always-free e gia' verificato in doc-1). Questo elimina il rischio di scadenza del free tier introduttivo e tutta la gestione di connessioni /. AC2 (stima costo per room/connection-minutes) e AC4 (TTL/idle-close/budget/kill switch) non si applicano piu' in questi termini specifici visto che non c'e' una connessione persistente da misurare; il costo reale (volume di richieste di polling) e i relativi limiti sono ora oggetto di TASK-49 (load test), non di questo task. Decisione registrata in ADR.
<!-- SECTION:FINAL_SUMMARY:END -->
