---
id: TASK-220
title: A/B test copy bottoni home (mode_selected)
status: Done
assignee: []
created_date: '2026-09-01 12:11'
updated_date: '2026-09-01 12:33'
labels:
  - growth
  - experiment
  - frontend
dependencies: []
priority: medium
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
mode_selected e' gia' scomposto per modalita' in dashboard (TASK-216). Il copy attuale dei 3 bottoni home (eval/daily/party) e' gia' in stile dark/horror ('TEST YOUR MORALITY', 'YOUR CONSCIENCE WILL BE JUDGED'). Testare quella tonalita' (baseline 'hook') contro un copy diretto/funzionale che dichiara chiaramente cosa succede (tempo/numero di dilemmi), senza cambiare ordine o layout dei bottoni.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bucketing deterministico via experiments.js, namespace 'home_mode_copy', 2 varianti: hook (baseline) e direct
- [x] #2 landing_viewed porta la property variant come esposizione; mode_selected e' gia' il segnale di conversione (nessun nuovo evento necessario)
- [x] #3 Backend: riusa build_experiment_breakdown (TASK-219) per esporre la conversione per variante
- [x] #4 Nuova sotto-sezione nel tab Growth della dashboard
- [x] #5 Nuove chiavi i18n solo in en.json
- [x] #6 Unit test backend; pnpm lint e pnpm build:prod passano
<!-- AC:END -->
