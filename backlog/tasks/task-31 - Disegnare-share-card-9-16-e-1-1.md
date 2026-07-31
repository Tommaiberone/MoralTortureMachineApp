---
id: TASK-31
title: 'Disegnare share card 9:16 e 1:1'
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:52'
labels:
  - m3-profiles
  - design
  - sharing
  - i18n
dependencies:
  - TASK-25
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Card bilingui con archetipo, visual, frase provocatoria, percentile e deep link leggibile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formati Stories e quadrato sono definiti
- [x] #2 IT ed EN non causano overflow
- [x] #3 La gerarchia resta leggibile su schermi piccoli
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nuovo frontend/src/utils/shareCard.js: generateShareCardDataUrl(archetype, 'stories'|'square') disegna su canvas offscreen due formati fissi (1080x1920 Stories, 1080x1080 quadrato) - AC1. Font-fitting dinamico (fitText/wrapText): riduce progressivamente la dimensione del font finche' il testo non rientra nel numero massimo di righe consentite, con una dimensione minima garantita per leggibilita' - copre sia l'overflow IT/EN (frasi italiane piu' lunghe) sia la leggibilita' su schermi piccoli (AC2, AC3), senza bisogno di due layout separati per lingua. Contenuto: emoji+nome archetipo, sharePhrase tra virgolette, wordmark e deep link leggibile in basso. Percentile intenzionalmente OMESSO: richiederebbe una popolazione reale di profili (TASK-28, non ancora esistente); inventarlo violerebbe il principio 'archetipi deterministici e testabili'. Collegato a due nuovi bottoni download in ResultsScreen.jsx (visibili solo se l'archetipo e' stato caricato). Nessun test automatico frontend aggiunto: il repo non ha un test runner frontend configurato (nessun vitest/jest), coerente con la convenzione esistente di verificare il frontend solo con lint+build. pnpm lint e build:prod puliti. Verifica visiva in browser reale NON eseguita in questa sessione (vedi nuova regola in CLAUDE.md su Playwright/chromium-cli).
<!-- SECTION:NOTES:END -->
