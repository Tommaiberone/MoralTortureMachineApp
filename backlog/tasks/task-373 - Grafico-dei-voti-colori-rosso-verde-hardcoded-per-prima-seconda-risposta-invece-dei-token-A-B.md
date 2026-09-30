---
id: TASK-373
title: >-
  Grafico dei voti: Challenge e BookChapter usano rosso/verde hardcoded invece
  dei token --choice-a/--choice-b
status: To Do
assignee: []
created_date: '2026-09-30 14:10'
updated_date: '2026-09-30 14:12'
labels:
  - frontend
  - content
dependencies: []
priority: low
ordinal: 274000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nel grafico della folla dopo il voto, ChallengeLandingScreen e BookChapterEntryScreen hardcodano #7a4a4a (rosso scuro) per la prima risposta e #2a3a2a (verde scuro) per la seconda: colori con connotazione buono/cattivo, mentre EvaluationDilemmasScreen usa gia' var(--choice-a)/var(--choice-b) e i pulsanti sono blu/ambra. Deriva visiva trovata nell'analisi bias del pool (book/catalog/bias-analysis.md). Allineare le due schermate ai token; verificare PartyRoomScreen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pnpm lint e pnpm build:prod passano
- [ ] #2 Challenge e BookChapter usano i token --choice-a/--choice-b come Evaluation
<!-- AC:END -->
