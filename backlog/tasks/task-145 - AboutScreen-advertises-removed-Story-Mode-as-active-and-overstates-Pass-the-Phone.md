---
id: TASK-145
title: >-
  AboutScreen advertises removed Story Mode as active and overstates
  Pass-the-Phone
status: To Do
assignee: []
created_date: '2026-08-05 09:05'
labels:
  - bug
  - frontend
  - content
dependencies: []
priority: medium
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AboutScreen.jsx:112-119 markets Story Mode as one of three active game modes with full descriptive copy, but the route is fully commented out in App.jsx:16,61 (Hidden for now) and the home button is commented out in HomeScreen.jsx - there is no path to it anywhere in the app. The same section also describes Pass-the-Phone as letting users compare your moral frameworks, which it does not do (it is a solo device feed with an aggregate community pie chart, no peer comparison). This is a trust problem on one of the few pages an evaluating visitor might read before trying the product. Verified by reading AboutScreen.jsx and App.jsx directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AboutScreen no longer describes Story Mode as an available feature (removed or clearly marked as coming later, consistent with whatever App.jsx actually ships)
- [ ] #2 The Pass-the-Phone description no longer claims a peer/friend comparison it does not provide
<!-- AC:END -->
