---
id: TASK-64
title: Definire policy di retention per ogni dominio
status: Done
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-06 14:49'
labels:
  - m9-privacy
  - privacy
  - decision
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Decidere retention per analytics, profili, challenge, account e acquisti bilanciando prodotto, privacy e obblighi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni tipo dati ha durata e base esplicita
- [x] #2 TTL e cancellazione sono implementabili
- [x] #3 Eccezioni legali sono strette e documentate
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Policy confermata e implementata: analytics first-party 90 giorni, GA4 2 mesi, Duel 30 giorni, Party 6 ore, alert 30 giorni, log 7 giorni, account e profili dopo 12 mesi di inattivita'. TTL e sweep giornaliero applicano i limiti; l'export/cancellazione estesi eliminano i dati collegabili e conservano solo statistiche aggregate non riconducibili.
<!-- SECTION:FINAL_SUMMARY:END -->
