---
id: TASK-216
title: >-
  Dashboard analytics: breakdown per proprieta (modalita, canali share, CTR
  login)
status: Done
assignee: []
created_date: '2026-08-31 13:48'
updated_date: '2026-08-31 13:58'
labels: []
dependencies: []
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
eventCounts nella dashboard mostra solo il conteggio totale per nome evento, senza scomporlo per le proprieta' che contano davvero: mode_selected (quale modalita' viene scelta dalla home: evaluation/duel/party/daily), share_clicked (canale: whatsapp/copy_link/facebook e object_type), auth_prompt_shown vs auth_prompt_clicked (CTR del CTA di login, metrica chiave TASK-14/135/136). Oggi non si puo' rispondere a 'quale modalita' sceglie piu' gente' ne' 'che CTR ha il prompt di login' guardando la dashboard.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuovo blocco backend che scompone mode_selected per la proprieta' mode, share_clicked per channel+object_type, e calcola il CTR auth_prompt_clicked/auth_prompt_shown per surface, rispettando i filtri days/platform
- [x] #2 GET /admin/analytics/overview espone il nuovo blocco (es. interactionBreakdowns), nessuna proprieta' vietata da doc-1 (Analytics contract) esposta
- [x] #3 AnalyticsAdminScreen mostra i tre breakdown in una sezione (nuovo tab o estensione del tab breakdowns esistente); nuove chiavi i18n solo in en.json (it.json drift exception)
- [x] #4 Unit test backend per il nuovo blocco
- [x] #5 pnpm lint, pnpm build:prod, backend py_compile e unit test passano
<!-- AC:END -->
