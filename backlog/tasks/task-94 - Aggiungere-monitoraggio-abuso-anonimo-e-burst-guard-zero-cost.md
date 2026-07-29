---
id: TASK-94
title: Aggiungere monitoraggio abuso anonimo e burst guard zero-cost
status: Done
assignee: []
created_date: '2026-07-29 12:37'
updated_date: '2026-07-29 13:11'
labels:
  - security
  - analytics
  - backend
  - frontend
  - cost
dependencies:
  - TASK-2
references:
  - backlog/tasks/task-67 - Rate-limit-degli-endpoint-costosi-e-abuse-prone.md
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prima tranche autonoma di TASK-67: classificare sessioni anonime anomale nella dashboard, limitare burst sugli endpoint costosi senza nuovi servizi a pagamento e rimuovere IP grezzi dagli access log, mantenendo compatibilità con web e APK esistenti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Overview analytics espone solo anomalie pseudonimizzate con motivazioni e intensità
- [x] #2 Dashboard Notion mostra stato abuso, soglie e sessioni da revisionare
- [x] #3 Burst guard configurabile protegge endpoint AI e ingest senza penalizzare traffico normale
- [x] #4 Access log non contiene IP grezzi e include il path utile alla diagnosi
- [x] #5 Test backend e build/lint frontend passano senza richiedere rebuild APK
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: implementati fingerprint di rete HMAC-peppered, detector privacy-safe con livelli watch/suspicious e motivazioni, burst guard per-container configurabile (120 globali, 12 AI, 30 batch analytics al minuto), dashboard Notion bilingue e access log senza IP grezzo con path. Passano 15 unit test backend, py_compile, pnpm lint, build production e terraform validate. Modifica backend retrocompatibile: nessun rebuild APK richiesto.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Prima tranche anti-abuso completata localmente senza nuovi servizi AWS: dashboard pseudonimizzata, protezione burst best-effort e logging API più utile e privacy-safe.
<!-- SECTION:FINAL_SUMMARY:END -->
