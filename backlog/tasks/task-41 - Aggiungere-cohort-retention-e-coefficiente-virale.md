---
id: TASK-41
title: Aggiungere cohort retention e coefficiente virale
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-09-01 10:41'
labels:
  - m4-duel
  - analytics
  - growth
dependencies:
  - TASK-40
documentation:
  - backlog/docs/doc-2
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dashboard per cohort D1/D7, referral e viral coefficient per canale una volta disponibili eventi e identità.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Retention usa una definizione documentata di utente attivo
- [x] #2 Viral coefficient è scomposto per canale
- [x] #3 Exact e inferred non vengono mischiati
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-01 10:41
---
Implementato 2026-09-01: build_retention_cohorts (D1/D7 pooled, active=1+ evento/giorno UTC, soglia minima 30 identita' come TASK-166) e build_viral_coefficient (per utm_source, completamenti/tentativi condivisione) in backend_fastapi.py, esposti in GET /admin/analytics/overview come retentionCohorts/viralCoefficient. Nuovo tab Growth in AnalyticsAdminScreen. Ha richiesto anche estrarre il campo utm in normalize_analytics_event, mai letto da nessuna parte prima (scritto su DynamoDB dal 2026-08 per Daily Moral Crime ma inutilizzato).
---
<!-- COMMENTS:END -->
