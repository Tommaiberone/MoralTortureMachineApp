---
id: TASK-285
title: >-
  ADR-124 cita erroneamente TASK-281 invece di TASK-280 per il batch di 71
  dilemmi everyday-life
status: Backlog
assignee: []
created_date: '2026-09-08 14:45'
labels: []
dependencies: []
priority: low
type: docs
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog/decisions/decision-1 - ADR-Log.md, voce 'ADR-124 - 71 new everyday life dilemmas added to dilemmas_en.json...' cita (TASK-281) sia nel titolo che nel testo. Il commit reale che ha spedito quel lavoro e' 525b198 'feat: add 71 everyday-life moral dilemmas to dilemmas_en.json (TASK-280)'. TASK-281 e' in realta' un task completamente diverso (il gamebook waitlist test in ResultsScreen). Trovato mentre si aggiungeva la voce ADR per TASK-281 e serviva un numero ADR libero.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Il riferimento (TASK-281) in ADR-124 viene corretto in (TASK-280)
- [ ] #2 Nessun altro riferimento incrociato a TASK-280/281 nel repo risulta invertito allo stesso modo
<!-- AC:END -->
