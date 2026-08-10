---
id: TASK-191
title: >-
  [regression] Party Room in produzione falliva con 500 per capacita' DynamoDB
  esaurita
status: Done
assignee: []
created_date: '2026-08-10 13:58'
labels:
  - backend
  - party-room
  - incident
dependencies: []
priority: high
type: bug
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha segnalato 'tantissimi errori' visti dal vivo. Trovati ~80 alert 500 ProvisionedThroughputExceededException su GET /party-rooms/{room_code} e POST /party-rooms/{room_code}/vote tra le 12:28 e le 13:38 UTC del 2026-08-10 (prod-moral-torture-machine-ops-error-alerts). Causa: party_rooms_table e party_participants_table erano provisionate a 1 RCU/1 WCU ciascuna; con POLL_INTERVAL_MS di polling per partecipante, bastano pochi partecipanti concorrenti per esaurirla. Scenario gia' anticipato da TASK-49 ('Load test Party Room da 2 a 20 partecipanti'), deliberatamente rimandato dall'utente il 2026-08-02 ('non ora') - non e' una regressione introdotta in questa sessione, ma un rischio noto che si e' materializzato con una partita reale in corso. Fix: bump a 5/5 RCU/WCU su entrambe le tabelle (backend/terraform/main.tf), ancora minuscolo nel pool condiviso da 25 RCU/25 WCU Free Tier (~17/25 dopo il bump, incluso il nuovo indice ParticipantIndex di oggi). E' uno stopgap dimensionato sul traffico reale osservato, non su un load test - TASK-49 resta la via corretta per un dimensionamento definitivo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 party_rooms_table e party_participants_table sono provisionate a 5/5 RCU/WCU
- [ ] #2 Il deploy e' andato a buon fine e non si osservano nuovi alert ProvisionedThroughputExceededException su /party-rooms/* dopo il deploy
<!-- AC:END -->
