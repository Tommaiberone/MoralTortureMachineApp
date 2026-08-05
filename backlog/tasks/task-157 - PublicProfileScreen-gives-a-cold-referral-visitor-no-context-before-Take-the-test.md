---
id: TASK-157
title: >-
  PublicProfileScreen gives a cold referral visitor no context before Take the
  test
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - growth
  - ux
dependencies: []
priority: low
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PublicProfileScreen.jsx:75-94 shows only the archetype card and a bare Take the test button - no context on what clicking it leads to (a comparison, a challenge, etc.), unlike ChallengeLandingScreen's teaser copy for the equivalent cold-landing case. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
