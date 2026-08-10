---
id: TASK-192
title: >-
  rematch_challenge/create_challenge fallback only resolve the current device's
  anonymous_user_id, not claimed multi-device identity
status: Backlog
assignee: []
created_date: '2026-08-10 14:04'
updated_date: '2026-08-10 14:05'
labels:
  - backend
  - auth
dependencies: []
priority: low
type: bug
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Root cause behind TASK-193 (POST /challenges 400 from /account) and almost certainly why the user found the Rematch button on /account broken too (now removed, TASK-194): create_challenge's profilePublicId-less fallback (get_latest_profile_for_anonymous_user) and rematch_challenge's participant-match check (participant['anonymousUserId'] != anonymous_user_id) both key off only request.headers['X-Anonymous-User-Id'] - the CURRENT device's anonymous id. TASK-177.2/177.4 introduced the first UI (/account) that surfaces data resolved across every anonymous_user_id ever claimed to an authenticated account (_claimed_anonymous_ids), so an account whose latest profile or a given Duel was created on a different, earlier-claimed device now sees archetype/duel history it cannot actually act on: challenge-creation 400s, rematch 403s ('You were not part of this challenge') for a challenge the account genuinely did participate in from another device. TASK-193 fixed the immediate create-challenge case by having the frontend pass an explicit profilePublicId. The Rematch button was removed from /account instead of applying the same fix, at the user's request (TASK-194). If Rematch (or any other current-device-only action) needs to work again from a multi-device account context in the future, both call sites need to resolve across claimed anonymous_user_ids for an authenticated caller, not just the request header.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 create_challenge and rematch_challenge (or their future callers) correctly resolve an authenticated caller's ownership/participation across every anonymous_user_id claimed to their account, not just the current device's
<!-- AC:END -->
