---
id: TASK-236
title: Applicare lo stile dossier alla schermata Moral Duel (ChallengeCompareScreen)
status: Backlog
assignee: []
created_date: '2026-09-04 10:16'
labels:
  - frontend
  - design
  - duel
dependencies: []
priority: medium
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il restyling 'dossier/verdetto' (TASK-233/234, Artifact 'Verdict Cards' https://claude.ai/code/artifact/4ad2e427-8fd9-4343-9791-f3e8da531724) a ChallengeCompareScreen.jsx/.css: layout a due colonne (archetipo chiamante vs avversario), percentuale di compatibilita' come momento tipografico principale, pairInsight AI, stesso sistema tipografico/texture delle altre schermate.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ChallengeCompareScreen applica il sistema dossier mantenendo il confronto a due colonne, la percentuale di compatibilita', il pairInsight AI-gated e il CTA rematch
- [ ] #2 pnpm lint e pnpm build:prod passano; nessun controllo browser live, verificato via code review
<!-- AC:END -->
