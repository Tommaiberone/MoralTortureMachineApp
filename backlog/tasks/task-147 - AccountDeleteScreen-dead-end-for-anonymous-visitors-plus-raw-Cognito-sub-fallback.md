---
id: TASK-147
title: >-
  AccountDeleteScreen dead end for anonymous visitors, plus raw Cognito sub
  fallback
status: Done
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-08-05 12:50'
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
- [x] #1 An anonymous visitor landing on /account sees a short explanation of what signing in unlocks, not just a bare login button
- [x] #2 The logged-in identity line never falls back to the raw sub; if email is unavailable it shows a neutral label instead
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: aggiunta una riga di spiegazione (account.notLoggedInBenefits) prima del bottone di login per i visitatori anonimi. loggedInAs ora usa user.email quando disponibile, altrimenti account.loggedInGeneric ('Signed in.') - non passa piu' il sub raw come fallback nell'interpolazione. Lint+build puliti.
<!-- SECTION:NOTES:END -->
