---
id: TASK-221
title: A/B test copy bottone Challenge a friend
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
