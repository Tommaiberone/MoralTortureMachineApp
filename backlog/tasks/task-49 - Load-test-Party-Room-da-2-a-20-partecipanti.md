---
id: TASK-49
title: Load test Party Room da 2 a 20 partecipanti
status: Backlog
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-02 10:13'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Piano proposto 2026-08-02, non ancora eseguito su richiesta dell'utente ('non ora'): il rate-limiter di polling (ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE, 90/min) e' basato sull'IP sorgente, quindi simulare 20 partecipanti da una sola macchina li farebbe bloccare come un'unica sorgente. Per un load test rappresentativo servirebbe alzare temporaneamente il limite via terraform apply per la finestra del test e riportarlo al valore originale subito dopo (nessun bump versione/deploy Android necessario, e' solo una env var Lambda). Riprendere da qui quando si vuole procedere.
<!-- SECTION:NOTES:END -->
