---
id: TASK-48
title: Aggiungere risultati e award di gruppo
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-02 09:28'
labels:
  - m6-party
  - frontend
  - sharing
dependencies:
  - TASK-47
documentation:
  - backlog/docs/doc-2
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reveal a voto completo o timeout, award closest pair, moral minority, most controversial e recap card.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Award sono deterministici e testati
- [x] #2 Reveal ha regole uguali per tutti
- [x] #3 Recap card è condivisibile
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nuovo modulo puro backend/src/party_awards.py (deterministico, testato in isolamento senza mock DynamoDB - 11 test) calcola tre premi al completamento della room: closest pair (coppia con il piu' alto overallAgreementPct, riusando compute_compatibility gia' esistente per Duel), moral minority (partecipante con la piu' bassa affinita' media col resto del gruppo, richiede >=3 partecipanti - con 2 nessuno e' 'minoranza' dell'altro, quindi il campo resta null invece di essere inventato), most controversial dilemma (il round con lo split first/second piu' vicino al 50/50, pareggi risolti sempre sul round piu' basso). AC1 (deterministici e testati): stesso tie-break a indice piu' basso gia' usato da archetype_engine per riproducibilita'. AC2 (reveal con regole uguali per tutti): i premi sono calcolati una volta lato server dentro GET /party-rooms/{code} usando indici di posizione nella lista partecipanti, mai l'anonymous_user_id, quindi tutti i client vedono esattamente lo stesso risultato. AC3 (recap condivisibile): generatePartyRecapCardDataUrl/sharePartyRecapCard in shareCard.js (canvas client-side, stesso approccio nessuna-AI di TASK-31/32, stesso fallback native-share-poi-download) mostra coppia piu' vicina, minoranza morale e dilemma piu' diviso; bottone 'Condividi il recap' nella schermata finale di PartyRoomScreen.jsx. Suite backend 107 test verde, pnpm lint/build:prod puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
