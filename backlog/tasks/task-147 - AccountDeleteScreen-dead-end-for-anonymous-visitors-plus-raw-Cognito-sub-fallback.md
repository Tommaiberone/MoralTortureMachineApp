---
id: TASK-147
title: >-
  AccountDeleteScreen dead end for anonymous visitors, plus raw Cognito sub
  fallback
status: To Do
assignee: []
created_date: '2026-08-05 09:06'
labels:
  - bug
  - frontend
  - ux
dependencies: []
priority: medium
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AccountDeleteScreen.jsx:79-93 - an anonymous visitor who clicks the homepage profile icon (the entry point TASK-120 just added as first-class) sees only a Login with Google button, no explanation of what an account unlocks (continuity across devices, saved comparisons). Separately, line 99 renders t(account.loggedInAs, {email: user?.email || user?.sub}) - if email is absent this would display an opaque Cognito UUID as the users identity. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An anonymous visitor landing on /account sees a short explanation of what signing in unlocks, not just a bare login button
- [ ] #2 The logged-in identity line never falls back to the raw sub; if email is unavailable it shows a neutral label instead
<!-- AC:END -->
