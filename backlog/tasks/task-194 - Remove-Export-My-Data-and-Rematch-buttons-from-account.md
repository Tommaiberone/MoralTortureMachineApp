---
id: TASK-194
title: Remove Export My Data and Rematch buttons from /account
status: Done
assignee: []
created_date: '2026-08-10 14:05'
updated_date: '2026-08-10 14:08'
labels:
  - frontend
dependencies: []
priority: medium
type: chore
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Direct user request while debugging TASK-193/192. Removed the Export My Data button and its handler from AccountDeleteScreen.jsx (GET /users/export backend endpoint itself is untouched - still reachable directly if ever needed, matches Privacy Policy wording that data-rights requests go 'by contacting the controller', not specifically an in-app button, so this is not a policy conflict). Removed the Rematch button/handler from the recent-Duels list (TASK-177.5) instead of fixing its likely-related multi-device 403 - the View action to ChallengeCompareScreen stays, which has its own working Rematch button. Cleaned up now-dead i18n keys (exportButton/exportError/duelRematchAction/duelRematching) and two copy references that mentioned export (account.notLoggedIn, account.deleteScope).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Export My Data button no longer appears on /account
- [x] #2 The Rematch button no longer appears in the recent-Duels list on /account; View still works
<!-- AC:END -->
