---
id: TASK-63.3
title: Apply TTL to Moral Duel creator participants
status: Done
assignee: []
created_date: '2026-08-06 12:40'
updated_date: '2026-08-06 12:42'
labels:
  - privacy
  - backend
  - moral-duel
dependencies:
  - TASK-34
modified_files:
  - backend/src/backend_fastapi.py
  - backend/tests/test_duel.py
parent_task_id: TASK-63
priority: high
type: bug
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-63 audit found that creator rows in challenge_participants do not receive expirationTime, unlike invitee rows. Restore the existing 30-day TTL for the Moral Duel domain.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A creator row written with a challenge receives expirationTime consistent with its challenge.
- [x] #2 A creator row written for a rematch receives expirationTime consistent with the new challenge.
- [x] #3 Tests cover both writes without changing Duel visibility or flow.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Creator participant rows now receive the same 30-day expirationTime as their challenge at creation and rematch. Targeted CreateChallengeTests and RematchChallengeTests passed (8 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
