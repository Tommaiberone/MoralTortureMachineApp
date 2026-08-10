---
id: TASK-42
title: Definire e pubblicare Daily Moral Crime
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-10 14:45'
labels:
  - m5-retention
  - content
  - backend
dependencies:
  - TASK-26
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Esporre un solo dilemma al giorno, scelto deterministicamente dal catalogo EN gia' pubblicato. Il Daily e' globale: la finestra cambia alle 09:00 UTC per tutti; nessun nuovo contenuto, scoring o traduzione IT nella prima release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La selezione del Daily dal catalogo EN esistente e' deterministica per giorno globale
- [x] #2 Il Daily e' EN-only e non modifica it.json, rispettando TASK-101
- [x] #3 La policy globale delle 09:00 UTC e' esplicita e l'ora locale del prossimo refresh e' mostrata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Release scope recorded before build: 1.6.4 (versionCode 19) -> 1.7.0 (versionCode 20). Daily is user-facing shared frontend behavior, so the mandatory Android release version bump applies. Per CLAUDE.md, the eventual push with this versionCode increase will require explicit confirmation because CI auto-publishes it to Google Play production.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-10 14:10
---
2026-08-10 product decision: ship the Daily now as a measured retention experiment. Scope: one global EN-only existing-catalog dilemma at 09:00 UTC; two choices; post-vote aggregate reveal; no archetype impact, streaks, push, or social graph.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the deterministic global 09:00 UTC Daily from the existing EN deck. The shared frontend shows the next refresh in local time; English-only scope is preserved.
<!-- SECTION:FINAL_SUMMARY:END -->
