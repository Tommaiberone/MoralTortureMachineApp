---
id: TASK-99
title: Migliorare leggibilita e UX dashboard analytics
status: Done
assignee: []
created_date: '2026-07-31 08:46'
updated_date: '2026-07-31 08:53'
labels:
  - frontend
  - ux
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La dashboard /admin/analytics (AnalyticsAdminScreen) e' densa e poco leggibile: font troppo piccoli nelle tabelle, JSON grezzo nella colonna dettagli, badge e testo a basso contrasto, gerarchia visiva debole tra sezioni. Migliorare la leggibilita e l'usabilita mantenendo il linguaggio visivo Notion-like richiesto da ADR-009 e da doc-1, senza toccare backend o schema dati.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testo e badge nelle tabelle hanno dimensione e contrasto leggibili senza zoom su schermo desktop standard
- [ ] #2 La colonna dettagli/JSON degli eventi recenti e' presentata in modo leggibile invece di un blob JSON inline
- [ ] #3 La gerarchia tra sezioni (KPI, abuse, trend, funnel, eventi) e' piu chiara tramite spaziatura, tipografia o raggruppamento
- [ ] #4 Il layout resta responsive e funzionante su viewport stretti (gia' testato dai breakpoint esistenti)
- [ ] #5 Nessuna modifica a backend, contratti API o dati esposti
<!-- AC:END -->
