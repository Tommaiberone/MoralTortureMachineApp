---
id: TASK-132
title: >-
  Possibili falsi positivi 429 in Party Room per partecipanti dietro lo stesso
  IP
status: Open Points
assignee: []
created_date: '2026-08-04 07:28'
updated_date: '2026-08-04 07:34'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato mentre si indagava una mail di alert reale (GET /party-rooms/V9NX5F returned 429). _rate_limit_source() usa request.client.host (IP sorgente) come chiave del burst guard; POLL_INTERVAL_MS lato frontend e' 1500ms (~40 req/min a partecipante) e il limite party_room_poll e' 90/min per sorgente (variables.tf). Party Room e' pensato per essere giocato da piu' persone nella stessa stanza, spesso sullo stesso WiFi/NAT: gia' con 3 partecipanti sulla stessa rete si superano sia il limite party_room_poll (90/min) sia quello global (120/min) condivisi per IP, causando 429 legittimi non dovuti ad abuso. Serve una decisione di prodotto/sicurezza (alzare i limiti, o cambiare la chiave del bucket per essere piu' granulare per partecipante pur restando abuse-resistant) prima di toccare il burst guard: non implementato in questa sessione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Deciso e documentato (ADR) come evitare che piu' partecipanti Party Room sulla stessa rete/IP si autolimitino a vicenda, mantenendo comunque una protezione anti-abuso best-effort
- [ ] #2 party_room_poll (e se necessario global) non genera piu' 429 per un party room con partecipanti multipli su una singola rete domestica entro un numero ragionevole di partecipanti (es. fino a PARTY_ROOM_MAX_PARTICIPANTS o una soglia esplicitamente concordata)
<!-- AC:END -->
