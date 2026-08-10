---
id: TASK-167
title: >-
  Decidere se promuovere Daily Moral Crime (TASK-42/43/44/45) da Backlog: D7
  retention misurata a 1,4% contro il gate 12-15%
status: Done
assignee: []
created_date: '2026-08-05 15:52'
updated_date: '2026-08-10 14:46'
labels:
  - growth
  - analytics
  - decision
  - product
dependencies:
  - TASK-166
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user explicitly chose on 2026-08-10 to run Daily Moral Crime now as a measured retention experiment, overriding the 2026-08-05 deferral. The approved scope promotes TASK-42/43/44 only: one global EN-only existing-catalog dilemma at 09:00 UTC, two choices, post-vote aggregate reveal, and Ask the Audience sharing. TASK-45 remains in Backlog: no push notifications in this release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The user explicitly chose to start the Daily now with the approved limited scope
- [x] #2 The decision and rationale are recorded in ADR-085
- [x] #3 TASK-42, TASK-43, and TASK-44 are completed; TASK-45 intentionally remains in Backlog
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The 2026-08-05 deferral was superseded by the user's explicit decision on 2026-08-10. ADR-085 records the experiment scope, privacy choices, Free Tier capacity check, and exclusion of FCM push notifications.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision executed: Daily Moral Crime is implemented as a constrained retention experiment. Push notifications remain deferred.
<!-- SECTION:FINAL_SUMMARY:END -->
