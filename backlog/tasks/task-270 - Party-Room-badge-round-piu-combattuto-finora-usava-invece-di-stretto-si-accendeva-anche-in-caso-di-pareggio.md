---
id: TASK-270
title: >-
  Party Room: badge 'round piu combattuto finora' usava >= invece di > stretto,
  si accendeva anche in caso di pareggio
status: Done
assignee: []
created_date: '2026-09-05 19:13'
updated_date: '2026-09-05 19:14'
labels:
  - bug
  - party-room
  - frontend
dependencies: []
priority: low
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha segnalato: durante il reveal di Party Room, il badge 'Most divided round so far' (party.mostDividedSoFar) si accendeva anche quando lo scarto di voti del round corrente era solo pari (non strettamente inferiore) a quello di un round precedente, per via del confronto >= in PartyRoomScreen.jsx (isMostDividedSoFar, confrontava ogni round precedente con priorImbalance >= currentImbalance). In caso di pareggio tra due round, entrambi si prendevano il badge. Voluto: solo il round strettamente piu' combattuto di tutti i precedenti lo mostra; un pareggio non lo riassegna. Nota: questo badge live (calcolato client-side su revealHistory, TASK-123) e' distinto dall'award finale mostControversialRoundIndex in backend/src/party_awards.py (compute_most_controversial_round), che non aveva questo problema - quello sceglie gia' un solo round con tie-break deterministico verso il piu' precoce.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PartyRoomScreen.jsx: isMostDividedSoFar usa > stretto invece di >= nel confronto con ogni round precedente
- [x] #2 pnpm lint e pnpm build:prod passano
<!-- AC:END -->
