---
id: TASK-74
title: Aggiungere frontend error reporting privacy-safe
status: Done
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-07-31 12:49'
labels:
  - m10-quality
  - observability
  - frontend
  - privacy
dependencies:
  - TASK-9
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raccogliere errori e contesto tecnico minimo senza PII, token, risposte o output AI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Payload è filtrato e documentato
- [x] #2 Errori sono correlabili a release e piattaforma
- [x] #3 Failure del reporter non impatta UX
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nuovo frontend/src/utils/errorReporting.js: reportError()/initializeErrorReporting() catturano window 'error' e 'unhandledrejection' globali, e sono agganciati a ErrorBoundary.jsx (componentDidCatch, che aveva un TODO esplicito per questo). Payload filtrato a soli 5 campi fissi (error_name, error_message, error_stack, component_stack, route), ciascuno troncato a 200 caratteri lato client (il backend RIFIUTA, non tronca, property piu' lunghe di 200 char); documentato nel commento di testa del modulo. Riusa trackEvent() esistente (gia' non-bloccante, try/catch, fire-and-forget) quindi eredita gratis correlabilita' a platform/appVersion/schemaVersion (AC2) e isolamento dai fallimenti del reporter (AC3). Nessun token/PII/risposta/output AI possibile nel payload per costruzione. pnpm lint e build:prod puliti. Verifica browser reale NON eseguita (vedi nota su TASK-22 e nuova regola in CLAUDE.md su Playwright/chromium-cli).
<!-- SECTION:NOTES:END -->
