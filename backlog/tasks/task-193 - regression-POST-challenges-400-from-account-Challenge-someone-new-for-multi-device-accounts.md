---
id: TASK-193
title: >-
  [regression] POST /challenges 400 from /account 'Challenge someone new' for
  multi-device accounts
status: Done
assignee: []
created_date: '2026-08-10 14:04'
updated_date: '2026-08-10 14:07'
labels:
  - backend
  - frontend
  - duel
dependencies: []
priority: high
type: bug
ordinal: 89000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User-reported live bug (pasted a failing POST https://.../challenges from browser DevTools). ops_error_alerts confirmed: POST /challenges returned 400 'Complete a moral profile before creating a challenge' at 13:56:52 UTC today. Root cause: AccountDeleteScreen.jsx's 'Challenge someone new' button (TASK-177.5) calls POST /challenges with no profilePublicId, relying on the backend's get_latest_profile_for_anonymous_user(anonymous_user_id) fallback - but that fallback only resolves the CURRENT device's X-Anonymous-User-Id header, while the button itself is only shown when GET /users/me/archetype found an archetype resolved across every anonymous_user_id ever claimed to the account (TASK-177.2). An account whose latest profile was created on a different, earlier-claimed device passes the display check but fails the create-challenge fallback. Same systemic gap documented more broadly in TASK-192. Fix: GET /users/me/archetype now also returns profilePublicId; the account page passes it explicitly in the POST /challenges body instead of relying on the fallback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Challenge someone new succeeds for an authenticated account whose latest profile lives under a different claimed anonymous_user_id than the current device
- [x] #2 GET /users/me/archetype's response includes profilePublicId alongside archetype
<!-- AC:END -->
