---
id: TASK-22
title: Ridurre attrito iniziale del test
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:48'
labels:
  - m2-activation
  - frontend
  - growth
dependencies:
  - TASK-7
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Auto-caricare il primo dilemma, precaricare il successivo e rendere onboarding skippabile o inline.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Non serve un click separato per ottenere il primo dilemma
- [x] #2 Il successivo è disponibile senza attesa percepibile
- [x] #3 Onboarding non blocca utenti di ritorno
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC3 era gia' soddisfatta: HomeScreen.jsx gia' salta il tutorial per utenti di ritorno via localStorage tutorial_completed_, con Skip disponibile in TutorialScreen. Implementato in EvaluationDilemmasScreen.jsx: (1) nuovo useEffect al mount che chiama fetchDilemma() automaticamente, nessun click richiesto per il primo dilemma; (2) prefetch del dilemma successivo in background (fetchDilemmaData(), non fetchDilemma) subito dopo aver registrato la scelta, mentre l'utente guarda la tease/il grafico; il click su 'prossimo dilemma' usa il valore prefetched via ref (nextDilemmaRef) se disponibile, saltando del tutto la chiamata di rete percepita. pnpm lint e build:prod puliti. Verifica in browser reale NON eseguita in questa sessione: l'utente ha chiesto esplicitamente di non usare Playwright/chromium-cli per il costo in token (vedi CLAUDE.md, sezione Development workflow); verificata solo staticamente via lettura del codice, lint e build.
<!-- SECTION:NOTES:END -->
