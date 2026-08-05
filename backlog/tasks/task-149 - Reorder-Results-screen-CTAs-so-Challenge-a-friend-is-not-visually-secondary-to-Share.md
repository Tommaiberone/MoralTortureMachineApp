---
id: TASK-149
title: >-
  Reorder Results screen CTAs so Challenge a friend is not visually secondary to
  Share
status: Done
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-08-05 12:50'
labels:
  - frontend
  - growth
  - ux
dependencies: []
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ResultsScreen.jsx renders the Share this result block (lines 264-318) before the Challenge a friend block (320-381) with identical visual weight, even though doc-2 defines completed challenges (not shares) as the North Star growth loop. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Challenge a friend is visually at least as prominent as Share this result on the results screen (e.g. rendered first, or given equal/greater visual weight)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: invertito l'ordine dei blocchi JSX in ResultsScreen - 'Sfida un amico' ora precede 'Condividi il risultato', coerente con doc-2 (le challenge completate sono la North Star metric, non gli share). Nessun'altra modifica. Lint+build puliti.
<!-- SECTION:NOTES:END -->
