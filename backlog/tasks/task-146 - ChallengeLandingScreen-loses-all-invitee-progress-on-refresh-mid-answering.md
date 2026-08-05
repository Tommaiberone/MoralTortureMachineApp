---
id: TASK-146
title: ChallengeLandingScreen loses all invitee progress on refresh mid-answering
status: To Do
assignee: []
created_date: '2026-08-05 09:05'
labels:
  - bug
  - frontend
  - growth
dependencies: []
priority: medium
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ChallengeLandingScreen.jsx:61-96 re-runs openChallenge() on every mount and always lands back on STEP.TEASER if the challenge is not yet completed; dilemmas/currentIndex/collectedAnswers are local-only React state (never persisted), and join is idempotent. So a page refresh or remount mid-answering silently wipes all progress and the invitee has to answer every dilemma again from zero - worse than the general preserve-progress gap already tracked for the solo test in TASK-24, and it directly hits the Challenge open-to-complete rate growth gate from doc-2. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An invitee who refreshes or remounts the page mid-answering resumes from where they left off instead of restarting from dilemma 1 (e.g. persist currentIndex/collectedAnswers to sessionStorage keyed by challenge token)
<!-- AC:END -->
