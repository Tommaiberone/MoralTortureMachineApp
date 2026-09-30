---
id: TASK-221
title: A/B test copy bottone Challenge a friend
status: Done
assignee: []
created_date: '2026-09-01 12:12'
updated_date: '2026-09-30 13:55'
labels:
  - growth
  - experiment
  - frontend
dependencies: []
priority: medium
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il bottone 'Challenge a friend' su Results e' il gate di apertura dell'intero funnel Duel. Testare 3 varianti del solo testo del bottone (non dell'intro sopra), a parita' di tutto il resto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bucketing deterministico via experiments.js, namespace 'challenge_button_copy', 3 varianti: baseline ('Challenge a friend'), rival ('Find your moral rival'), direct ('See who's worse than you')
- [x] #2 result_viewed porta la property variant come esposizione (quando l'archetipo e' disponibile); challenge_share_ready e' il segnale di conversione
- [x] #3 Backend: riusa build_experiment_breakdown per esporre la conversione per variante
- [x] #4 Nuova sotto-sezione nel tab Growth della dashboard
- [x] #5 Nuove chiavi i18n solo in en.json
- [x] #6 Unit test backend; pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Concluso il 2026-09-30 su decisione dell'utente (ADR-158). Numeri finali, 30 giorni (ADR-156): direct 29/136 = 21,3%, rival 24/146 = 16,4%, baseline 13/138 = 9,4%. Contro rival (variante piu' esposta, regola della skill) nessuno significativo (direct z = 1,05; baseline z = -1,76); direct contro baseline z = 2,73, che regge la correzione di Bonferroni per tre confronti. ResultsScreen.jsx mostra sempre 'See who's worse than you' (results.challenge_button in en.json; chiavi baseline/rival rimosse; it.json intatto). result_viewed continua a mandare variant=direct per monitorare la conversione. Web live al deploy; Android 1.13.0 resta sul test a tre vie fino alla prossima release APK (serve bump di versione, e conferma esplicita perche' pubblica su Google Play production).
<!-- SECTION:NOTES:END -->
