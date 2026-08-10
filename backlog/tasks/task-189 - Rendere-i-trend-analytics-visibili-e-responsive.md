---
id: TASK-189
title: Rendere i trend analytics visibili e responsive
status: Done
assignee: []
created_date: '2026-08-10 13:30'
updated_date: '2026-08-10 13:35'
labels:
  - frontend
  - ux
  - analytics
dependencies: []
modified_files:
  - frontend/src/screens/AnalyticsAdminScreen.jsx
  - frontend/src/screens/AnalyticsAdminScreen.css
priority: medium
type: enhancement
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La dashboard analytics ha gia grafici Recharts, ma la tab iniziale Abuse li nasconde. Portare Trend come vista predefinita e migliorare navigazione, leggibilita e interazione su mobile senza modificare backend, API o dati esposti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All'apertura della dashboard autenticata, il pannello Trend con grafici eventi/utenti e piattaforme e subito visibile
- [x] #2 Controlli, schede e grafici restano leggibili e utilizzabili su viewport stretti senza overflow orizzontale della pagina
- [x] #3 Il layout mantiene le tab a pannello singolo e il linguaggio visivo Notion-like
- [x] #4 Nessuna modifica a backend, contratti API o dati esposti
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Trend reso pannello iniziale, con grafici resilienti all'assenza di dati e layout/controlli ottimizzati per mobile. Nessun backend o contratto API modificato. Verificato con pnpm lint e pnpm build:prod; nessun browser check automatizzato per policy del repository.
<!-- SECTION:FINAL_SUMMARY:END -->
