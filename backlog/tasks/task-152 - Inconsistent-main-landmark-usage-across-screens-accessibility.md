---
id: TASK-152
title: Inconsistent main landmark usage across screens (accessibility)
status: Backlog
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - accessibility
dependencies: []
priority: low
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Newer screens (ChallengeLandingScreen.jsx:215, PartyRoomHomeScreen.jsx:52, PartyRoomScreen.jsx:247, PublicProfileScreen.jsx:59, AccountDeleteScreen.jsx:63) wrap content in a main landmark, while the highest-traffic original screens (HomeScreen.jsx:57, EvaluationDilemmasScreen.jsx:288, ResultsScreen.jsx:184, PassThePhoneScreen.jsx:182, TutorialScreen.jsx:137) use a plain div with no landmark - hurting screen-reader landmark navigation on exactly the screens that matter most for activation. Separate from the already-tracked color-contrast accessibility tasks (TASK-102/107/124). Verified by reading the files directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
