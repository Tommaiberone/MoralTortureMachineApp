---
id: TASK-148
title: >-
  PartyRoomScreen has no reconnecting/connection-lost indicator on silent
  polling failures
status: To Do
assignee: []
created_date: '2026-08-05 09:06'
labels:
  - bug
  - frontend
  - party-room
dependencies: []
priority: medium
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PartyRoomScreen.jsx fetchRoom's catch block (around line 83-86) only logs to console; if the 1.5s poll starts failing (network blip, backend hiccup), the screen just stops updating with no reconnecting or connection lost indicator, so a stalled game looks identical to normal waiting for others. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After N consecutive failed polls, PartyRoomScreen shows a visible connection lost/reconnecting state instead of silently doing nothing
- [ ] #2 Recovery (a poll succeeding again) clears the indicator automatically
<!-- AC:END -->
