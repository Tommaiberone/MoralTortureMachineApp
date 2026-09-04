---
id: TASK-264
title: >-
  Margine top eccessivo su .screen-container a <=480px, shiftava in basso ogni
  schermata mobile inclusa la homepage
status: Done
assignee: []
created_date: '2026-09-04 18:54'
updated_date: '2026-09-04 18:54'
labels:
  - bug
  - css
  - mobile
dependencies: []
priority: high
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha segnalato che la homepage su smartphone appariva 'shiftata in basso'. Causa: shared.css .screen-container/.screen-container-wide avevano padding-top 40px (desktop) -> 30px (tablet, <=768px) -> 60px (mobile piccolo, <=480px) - un salto anomalo verso l'alto invece che verso il basso, introdotto nel commit 8e08334 'centralize styles' senza motivazione documentata. Sulla homepage, che non ha un nav-back-button da compensare, questo produceva un vuoto ingiustificato in cima allo schermo su ogni telefono. Fix: padding-top riportato a 30px a quel breakpoint, coerente con la progressione discendente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 shared.css: .screen-container e .screen-container-wide a <=480px usano padding 30px 10px 20px invece di 60px 10px 20px
- [x] #2 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fix CSS one-line, verificato con lint+build. Nessun controllo su dispositivo reale (no Playwright/browser automation per CLAUDE.md) - da confermare visivamente.
<!-- SECTION:FINAL_SUMMARY:END -->
