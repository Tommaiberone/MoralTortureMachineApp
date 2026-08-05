---
id: TASK-149
title: >-
  Reorder Results screen CTAs so Challenge a friend is not visually secondary to
  Share
status: To Do
assignee: []
created_date: '2026-08-05 09:06'
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
- [ ] #1 Challenge a friend is visually at least as prominent as Share this result on the results screen (e.g. rendered first, or given equal/greater visual weight)
<!-- AC:END -->
