---
id: TASK-222
title: A/B test copy creazione stanza Party Room
status: Done
assignee: []
created_date: '2026-09-01 12:12'
updated_date: '2026-09-01 12:33'
labels:
  - growth
  - experiment
  - frontend
dependencies: []
priority: medium
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PartyRoomHomeScreen non ha oggi nessun evento di 'pagina vista'. Aggiungere un evento party_home_viewed (nuovo) e testare 2 varianti del solo testo del bottone di creazione stanza.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bucketing deterministico via experiments.js, namespace 'party_create_copy', 2 varianti: baseline ('Create room'), dramatic ('Start the trial')
- [x] #2 Nuovo evento party_home_viewed (con property variant) al mount di PartyRoomHomeScreen come esposizione; party_room_create_clicked resta il segnale di conversione
- [x] #3 Backend: riusa build_experiment_breakdown per esporre la conversione per variante
- [x] #4 Nuova sotto-sezione nel tab Growth della dashboard
- [x] #5 Nuove chiavi i18n solo in en.json
- [x] #6 Unit test backend; pnpm lint e pnpm build:prod passano
<!-- AC:END -->
