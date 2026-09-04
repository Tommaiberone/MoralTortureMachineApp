---
id: TASK-232
title: Unificare lo stile 'archetype card' duplicato in 4 file CSS
status: Backlog
assignee: []
created_date: '2026-09-04 08:28'
labels:
  - frontend
  - css
  - tech-debt
dependencies: []
priority: low
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-210 ha aggiunto una quarta variante bespoke di 'archetype card' (emoji+nome+strength/blindspot in un box bordato) in PartyRoomScreen.css/.jsx (.party-group-archetype*), che si affianca a 3 implementazioni gia' esistenti e divergenti: .results-archetype* (ResultsScreen.css), .compare-archetype-card (ChallengeCompareScreen.css), .account-archetype-card (AccountDeleteScreen.css). Nessuna delle 4 riusa le altre; ognuna ha markup/nomi classe/padding leggermente diversi. Promuovere il pattern in una classe condivisa in shared.css (es. .archetype-card, .archetype-card-emoji, .archetype-card-name) e migrare le 4 screen a riusarla, secondo la convenzione 'reuse and unify over duplicating' di CLAUDE.md (TASK-214/ADR-095).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Una singola classe/set di classi condivise in shared.css copre il pattern archetype-card (emoji, nome, colore accento, strength/blindspot)
- [ ] #2 ResultsScreen, ChallengeCompareScreen, AccountDeleteScreen e PartyRoomScreen migrate a riusarla, nessuna ridefinizione locale duplicata
- [ ] #3 Nessuna regressione visiva; pnpm lint e pnpm build:prod passano
<!-- AC:END -->
