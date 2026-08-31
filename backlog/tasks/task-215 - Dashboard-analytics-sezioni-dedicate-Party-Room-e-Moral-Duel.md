---
id: TASK-215
title: 'Dashboard analytics: sezioni dedicate Party Room e Moral Duel'
status: Done
assignee: []
created_date: '2026-08-31 13:48'
updated_date: '2026-08-31 14:01'
labels: []
dependencies: []
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il funnel generico della dashboard (build_analytics_overview) copre solo Solo Evaluation (test_started/answer_selected/test_completed/result_viewed/share_clicked) e Daily Moral Crime ha gia' una sezione dedicata (TASK-197, build_daily_moral_crime_analytics). Party Room e Moral Duel hanno eventi dedicati ricchi (party_room_entered/vote_submitted/recap_shared, challenge_share_ready/landing_viewed/joined_client/completed_client/compare_viewed) ma zero sezione propria: finiscono solo come righe piatte nella lista eventCounts. Aggiungere due nuove sezioni dashboard, mirror del pattern Daily gia' esistente (funnel per identita' distinte + tab dedicato).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova funzione backend build_party_room_analytics con funnel per-partecipante entered -> voted -> shared (party_room_entered/party_room_vote_submitted/party_room_recap_shared) piu' contatori separati per le azioni host-only (create_clicked/started_ui/advanced_ui/rematch_created)
- [x] #2 Nuova funzione backend build_moral_duel_analytics con funnel share_ready -> landing_viewed -> joined_client -> completed_client -> compare_viewed
- [x] #3 GET /admin/analytics/overview espone i due nuovi blocchi rispettando i filtri days/platform esistenti, stesso pattern di dailyMoralCrime
- [x] #4 Unit test backend per le due nuove funzioni (casi: nessun evento, funnel parziale, evento fuori periodo/piattaforma escluso)
- [x] #5 pnpm lint, pnpm build:prod, backend py_compile e unit test passano
- [x] #6 AnalyticsAdminScreen ha due nuovi tab (party, duel) nella sidebar con lo stesso pattern visivo del tab daily esistente; nuove chiavi i18n solo in en.json (it.json drift exception, CLAUDE.md 2026-08-02)
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-31 14:01
---
Android version bump per il rilascio: versionName 1.7.5 -> 1.7.6 (patch), versionCode 25 -> 26. Include anche TASK-216/217 in questo stesso change set.
---
<!-- COMMENTS:END -->
