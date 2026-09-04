---
id: TASK-237
title: Applicare lo stile dossier al reveal Daily Moral Crime
status: Backlog
assignee: []
created_date: '2026-09-04 10:16'
labels:
  - frontend
  - design
  - daily
dependencies: []
priority: medium
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il restyling 'dossier/verdetto' (TASK-233/234, Artifact 'Verdict Cards' https://claude.ai/code/artifact/4ad2e427-8fd9-4343-9791-f3e8da531724) a DailyMoralCrimeScreen.jsx/.css: stesso sistema tipografico/texture applicato al reveal post-voto (percentuale 'chose like you' come momento tipografico principale, breakdown delle due opzioni con barre etichetta-sopra/barra-sotto).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 DailyMoralCrimeScreen applica il sistema dossier al reveal post-voto mantenendo tutte le funzionalita' esistenti (streak, share, Ask the Audience)
- [ ] #2 Le barre del breakdown non hanno testo coperto da elementi colorati
- [ ] #3 pnpm lint e pnpm build:prod passano; nessun controllo browser live, verificato via code review
<!-- AC:END -->
