---
id: TASK-6
title: Completare la strumentazione del funnel prodotto
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-29 14:06'
labels:
  - m0-foundation
  - analytics
  - frontend
dependencies:
  - TASK-2
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coprire landing, scelta modalità, tutorial, avvio test, risposta, completamento, risultato, condivisione, challenge, auth, paywall e acquisto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni evento usa snake_case e include schema_version, platform e app_version
- [x] #2 Il funnel landing-risultato è ricostruibile per web e Android
- [x] #3 Gli errori analytics non interrompono mai il gioco
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verifica 2026-07-29: landing_viewed, mode_selected, test_started, answer_selected, test_completed, result_viewed, share_clicked e auth_* sono già emessi dalla pipeline batch privacy-safe. Verifica in corso di schema, platform e app_version per sbloccare SEO/ASO intelligence.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Verificato il 2026-07-29: gli eventi landing_viewed, mode_selected, test_started, answer_selected, test_completed e result_viewed ricostruiscono il funnel landing-risultato. La pipeline client include schemaVersion, platform e appVersion; Pydantic impone snake_case e il batching best-effort cattura gli errori senza interrompere il gioco. Web e Android condividono il modulo analytics.
<!-- SECTION:FINAL_SUMMARY:END -->
