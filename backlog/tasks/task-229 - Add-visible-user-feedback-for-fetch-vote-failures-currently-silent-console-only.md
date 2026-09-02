---
id: TASK-229
title: >-
  Add visible user feedback for fetch/vote failures (currently silent
  console-only)
status: Backlog
assignee: []
created_date: '2026-09-02 09:00'
updated_date: '2026-09-02 09:00'
labels:
  - frontend
  - ux
  - polish
dependencies: []
priority: low
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-150 (chiuso 2026-09-02). Quando TASK-150 fu scritto, EvaluationDilemmasScreen.jsx/ResultsScreen.jsx/ChallengeLandingScreen.jsx usavano window.alert() per errori di fetch/voto - rotto visivamente ma almeno visibile. Le chiamate ad alert() sono sparite dal codice (nessun match su window.alert in frontend/src/screens), ma non sono state sostituite da un componente toast/inline error: ora falliscono con solo un console.error/console.warn (es. EvaluationDilemmasScreen.jsx righe 117/154/199) che nessun utente reale vede mai. Un utente il cui voto o fetch fallisce oggi non ha alcun segnale che qualcosa sia andato storto - vede semplicemente l'app bloccata o silente. Nessun componente toast/snackbar esiste ancora nel frontend (verificato: nessun match per Toast/Snackbar in frontend/src).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mappati tutti i punti in cui un errore di fetch/voto/rete viene oggi solo loggato in console senza feedback visibile all'utente
- [ ] #2 Introdotto un componente toast/inline-error minimo coerente con il tema horror esistente (styles/shared.css), riusabile su piu' schermate
- [ ] #3 Ogni punto mappato mostra il feedback invece di fallire silenziosamente
<!-- AC:END -->
