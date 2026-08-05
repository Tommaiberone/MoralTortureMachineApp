---
id: TASK-151
title: >-
  Full-page-reload anchor links used instead of SPA navigation in several
  screens
status: Backlog
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - ux
  - polish
dependencies: []
priority: low
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Several screens use a href=/ (or similar) for back/home links instead of navigate()/Link, causing a full page reload, bundle re-download and visible flicker: ChallengeLandingScreen.jsx:227, ChallengeCompareScreen.jsx:106,219, PartyRoomHomeScreen.jsx:109, PartyRoomScreen.jsx:249,495, PublicProfileScreen.jsx:70,92, AccountDeleteScreen.jsx:73,89,130, LegalScreen.jsx:10 - while the rest of the app correctly uses React Router. Verified by reading the files directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
