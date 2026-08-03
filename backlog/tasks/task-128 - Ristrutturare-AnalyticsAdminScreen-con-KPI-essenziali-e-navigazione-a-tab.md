---
id: TASK-128
title: Ristrutturare AnalyticsAdminScreen con KPI essenziali e navigazione a tab
status: Done
assignee: []
created_date: '2026-08-03 18:01'
updated_date: '2026-08-03 18:08'
labels:
  - frontend
  - ux
  - backend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La dashboard /admin/analytics mostra tutte le sezioni (abuse, trend, funnel, breakdown, eventi) in un unico scroll continuo e non espone il conteggio degli account registrati (iscrizioni), una metrica essenziale assente. Ristrutturare con: (1) una fascia KPI essenziale sempre visibile in alto che include il conteggio account registrati (letto da users_table, escludendo i record claim-lock anon#), (2) sezioni raggiungibili cliccando in sidebar con un solo contenuto visibile alla volta (pattern a tab) invece dello scroll continuo attuale basato su IntersectionObserver.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La fascia KPI in alto mostra il conteggio totale degli account registrati (iscrizioni), sempre visibile indipendentemente dalla sezione attiva
- [x] #2 Il conteggio esclude i record claim-lock anon# della tabella users e non introduce nuove scritture né modifica lo schema
- [x] #3 Cliccando una voce della sidebar (Abuse, Trend, Funnel, Breakdown, Eventi) si vede solo il contenuto di quella sezione, non più uno scroll continuo con tutte le sezioni
- [x] #4 Il layout resta responsive sui breakpoint stretti già coperti
- [x] #5 Nessuna modifica a schema dati, endpoint pubblici non-admin o contratti esistenti oltre al nuovo campo nella risposta di /admin/analytics/overview
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Backend: _count_registered_users() COUNT scan on users_table (excludes anon# claim rows), passed through build_analytics_overview as summary.registeredUsers, cached with the existing 60s overview cache. Frontend: AnalyticsAdminScreen restructured to single-panel tab navigation (abuse/trends/funnel/breakdowns/events), scroll-spy IntersectionObserver removed, always-visible KPI band now leads with registeredUsers. en.json gets the new registeredUsers key only (it.json drift exception applies). Verified: backend py_compile + unittest test_analytics_models (24 passed), frontend eslint + build:prod clean. No live browser check performed per repo policy.
<!-- SECTION:NOTES:END -->
