---
id: TASK-170
title: >-
  Introdurre un test runner frontend (es. Vitest) per coprire comportamenti
  solo-frontend senza browser reale
status: To Do
assignee: []
created_date: '2026-08-05 18:58'
labels:
  - frontend
  - testing
  - tooling
dependencies: []
priority: low
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il repo non ha alcun test runner frontend configurato (nessuno script 'test' in frontend/package.json, nessuna dipendenza vitest/jest). Scoperto lavorando su TASK-16 AC2 ('Logout rimuove la sessione browser'): non esiste modo automatico di verificarlo senza un test runner, dato che CLAUDE.md vieta l'uso di browser automation (Playwright/Puppeteer) per costo/tempo. Un test runner leggero come Vitest (gia' compatibile con Vite/ESM, nessuna dipendenza da un browser reale grazie a jsdom) permetterebbe di testare unita' pure di frontend/src/auth (es. che il logout cancelli sessionStorage/i token PKCE) e altre utility (session.js, shareCard.js) senza le limitazioni della regola anti-browser-automation. E' una decisione di tooling (scelta del framework, script npm, eventuale wiring CI in deploy.yml) quindi non implementata autonomamente in questa sessione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E' stato scelto e configurato un test runner frontend (es. Vitest) con almeno un test reale che passa
- [ ] #2 package.json ha uno script 'test' funzionante; documentato se/come viene eseguito in CI
<!-- AC:END -->
