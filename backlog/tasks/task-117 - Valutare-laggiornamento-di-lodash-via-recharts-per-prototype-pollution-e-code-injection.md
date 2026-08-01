---
id: TASK-117
title: >-
  Valutare l'aggiornamento di lodash (via recharts) per prototype pollution e
  code injection
status: To Do
assignee: []
created_date: '2026-08-01 14:45'
labels:
  - security
  - frontend
  - dependency
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
pnpm audit segnala lodash <=4.17.23 (dipendenza transitiva di recharts, usato per il radar chart dei risultati) con prototype pollution in _.unset/_.omit e code injection via _.template. Recharts non sembra usare _.template internamente per il rendering, quindi l'impatto reale e' probabilmente basso, ma va verificato se una versione piu' recente di recharts risolve la dipendenza prima di considerare un override manuale del lockfile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E' stato verificato se una versione di recharts gia' pubblicata risolve la dipendenza lodash vulnerabile, altrimenti e' stato valutato un pnpm override mirato
<!-- AC:END -->
