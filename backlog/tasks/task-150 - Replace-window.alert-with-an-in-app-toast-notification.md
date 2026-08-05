---
id: TASK-150
title: Replace window.alert() with an in-app toast/notification
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
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
window.alert() is used for confirmations and errors in at least 6 spots: EvaluationDilemmasScreen.jsx:152,197 (fetch/vote failure), ResultsScreen.jsx:289,371 (Facebook copy notice, link-copied notice), ChallengeLandingScreen.jsx (vote error). Each one breaks the horror-themed UI with a plain OS dialog and blocks the JS thread. No in-app toast/snackbar component exists yet. Verified by reading the files directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
