---
id: TASK-150
title: Replace window.alert() with an in-app toast/notification
status: Backlog
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-09-02 08:59'
labels:
  - frontend
  - ux
  - polish
dependencies: []
priority: low
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
window.alert() is used for confirmations and errors in at least 6 spots: EvaluationDilemmasScreen.jsx:152,197 (fetch/vote failure), ResultsScreen.jsx:289,371 (Facebook copy notice, link-copied notice), ChallengeLandingScreen.jsx (vote error). Each one breaks the horror-themed UI with a plain OS dialog and blocks the JS thread. No in-app toast/snackbar component exists yet. Verified by reading the files directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Chiuso 2026-09-02 su richiesta esplicita dell'utente. Verificato che window.alert() non esiste piu' nel codice (grep pulito su frontend/src/screens) - la premessa originale del task e' superata. Nota per chi legge in futuro: le chiamate che usavano alert() ora falliscono in silenzio con solo un console.error/console.warn (es. EvaluationDilemmasScreen.jsx righe 117/154/199), quindi il problema di fondo (nessun feedback visibile all'utente su un errore di fetch/voto) non e' stato risolto, e' semplicemente diventato invisibile invece che fastidioso. Aperto TASK-229 per tracciare questo separatamente.
<!-- SECTION:NOTES:END -->
