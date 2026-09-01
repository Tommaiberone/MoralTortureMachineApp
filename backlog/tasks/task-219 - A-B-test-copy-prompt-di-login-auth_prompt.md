---
id: TASK-219
title: A/B test copy prompt di login (auth_prompt)
status: Done
assignee: []
created_date: '2026-09-01 12:11'
updated_date: '2026-09-01 12:33'
labels:
  - growth
  - experiment
  - frontend
dependencies: []
priority: high
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il CTR shown->clicked del prompt di login (auth_prompt_shown/clicked) e' gia' in dashboard (TASK-216). Testare 3 varianti di copy sulle 3 superfici hard-gate che condividono la stessa semantica (devi loggarti per proseguire): results_challenge (2+ Duel da Results), challenge_join (accettare un secondo invito), challenge_rematch (rematch). Esclude deliberatamente challenge_compare (sblocco pair insight), che e' un upsell opzionale con semantica diversa, non un hard gate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bucketing deterministico e persistente per anonymous_user_id via il nuovo frontend/src/utils/experiments.js, namespace 'auth_prompt_copy', 3 varianti: value (baseline attuale), urgency, curiosity
- [x] #2 Le 3 varianti sono applicate coerentemente sulle 3 superfici hard-gate; auth_prompt_shown/clicked portano la property variant
- [x] #3 Backend: nuova funzione generica build_experiment_breakdown(events, experiment_name, exposure_event, conversion_event) espone conversione per variante in GET /admin/analytics/overview
- [x] #4 Nuova sotto-sezione nel tab Growth della dashboard
- [x] #5 Nuove chiavi i18n solo in en.json (it.json drift exception)
- [x] #6 Unit test backend; pnpm lint e pnpm build:prod passano
<!-- AC:END -->
