---
id: TASK-46
title: Creare backend Party Room realtime
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-02 09:07'
labels:
  - m6-party
  - backend
  - database
  - polling
dependencies:
  - TASK-37
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Room code e QR, presenza, stato corrente, timer e voting via polling HTTP (non WebSocket, decisione esplicita dell'utente - vedi ADR): il client interroga periodicamente lo stato della room con lo stesso pattern gia' usato per Moral Duel (API Gateway HTTP, Lambda, DynamoDB). Il timer di reveal e' sincronizzato passando un timestamp di scadenza dal server; il countdown visivo e' calcolato lato client, senza bisogno di push.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Room code non espone ID interni
- [ ] #2 Connessioni idle vengono chiuse
- [x] #3 Room abbandonate scadono
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementato il loop centrale via HTTP polling (ADR-050, non WebSocket): due nuove tabelle DynamoDB provisioned 1/1 (party_rooms, party_participants, TTL 6h) e 6 endpoint in backend_fastapi.py (POST /party-rooms, POST .../join, POST .../start, POST .../vote, GET /party-rooms/{code}). Il roomCode e' breve (6 caratteri, alfabeto senza ambiguita' 0/O/1/I/L) invece di un token lungo come Duel: e' pensato per QR/lettura ad alta voce/digitazione manuale in un contesto di persone nella stessa stanza, non e' un ID interno e la room scade in poche ore, quindi non serve la stessa entropia dei link Duel (AC1 soddisfatto). La room avanza 'pigramente': non esiste un endpoint 'avanza al turno successivo', ogni GET/POST ricalcola se la fase corrente e' scaduta (timeout o tutti hanno votato) e applica la transizione con un update condizionale DynamoDB, cosi' nessun client specifico deve restare in primo piano. AC2 (connessioni idle chiuse) non si applica piu' in questi termini: non essendoci connessioni persistenti, l'equivalente e' il nuovo bucket di rate-limit dedicato (ABUSE_PARTY_ROOM_POLL_REQUESTS_PER_MINUTE) piu' il TTL della room. 11 nuovi unit test (incluso un fake DynamoDB in-memory con vere semantiche di conditional-update, non solo mock scriptati) verificano idempotenza del join, immutabilita' del voto, avanzamento per timeout e per voto completo, e che l'anonymous_user_id di un partecipante non venga mai esposto agli altri. Suite backend 95 test verde, terraform validate ok.
<!-- SECTION:FINAL_SUMMARY:END -->
