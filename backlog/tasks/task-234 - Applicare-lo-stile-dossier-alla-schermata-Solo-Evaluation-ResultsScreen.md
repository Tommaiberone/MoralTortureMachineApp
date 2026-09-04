---
id: TASK-234
title: Applicare lo stile dossier alla schermata Solo Evaluation (ResultsScreen)
status: Backlog
assignee: []
created_date: '2026-09-04 10:15'
labels:
  - frontend
  - design
  - results
dependencies: []
priority: medium
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il restyling 'dossier/verdetto' approvato per le share card (TASK-233, vedi Artifact 'Verdict Cards' https://claude.ai/code/artifact/4ad2e427-8fd9-4343-9791-f3e8da531724) alla schermata live di ResultsScreen.jsx/.css: font Special Elite+JetBrains Mono per titoli/dati, glow per-archetipo, grana, tacche di registro, barre statistiche con etichetta/valore sopra e barra sotto (mai affiancate). A differenza delle card canvas, qui e' CSS/DOM reale (niente canvas/FontFace API) - i font vanno caricati con <link> Google Fonts, scoped a questa schermata per non toccare shared.css/le altre modalita' senza necessita'. Priorita' a questa schermata perche' e' quella con piu' traffico (ogni utente anonimo che completa il test la vede).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ResultsScreen applica il sistema dossier (tipografia, glow accento archetipo, grana, cornice) mantenendo tutte le funzionalita' esistenti (radar chart, verdetto AI, challenge CTA, share card)
- [ ] #2 Le barre/elementi statistici non hanno testo coperto da elementi colorati
- [ ] #3 Nessuna regressione alle altre schermate (font/stili scoped a ResultsScreen, non promossi a shared.css senza necessita' dimostrata)
- [ ] #4 pnpm lint e pnpm build:prod passano; nessun controllo browser live (regola no-Playwright), verificato via code review
<!-- AC:END -->
