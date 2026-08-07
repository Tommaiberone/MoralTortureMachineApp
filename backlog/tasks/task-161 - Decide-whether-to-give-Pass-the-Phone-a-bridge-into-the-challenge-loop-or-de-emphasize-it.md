---
id: TASK-161
title: >-
  Decide whether to give Pass-the-Phone a bridge into the challenge loop or
  de-emphasize it
status: Done
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-07 11:00'
labels:
  - product
  - growth
  - decision
dependencies: []
priority: medium
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pass-the-Phone mode (PassThePhoneScreen.jsx, whole file) has no archetype, no comparison, no share, and no path back into the challenge/retention loop - yet it occupies equal visual weight on the homepage as the recommended evaluation flow (HomeScreen.jsx). Given doc-2s North Star is completed challenges, this mode currently contributes nothing to it. Not obviously a fix so much as a strategic call: add a bridge CTA into Evaluation/Challenge after a Pass-the-Phone round, or deliberately de-emphasize it on the homepage. Verified by reading the file directly (TASK-111 UX audit).

Decided 2026-08-07 (user's explicit call, superseding the two options above): remove Pass-the-Phone entirely rather than bridge or de-emphasize it. The two bilingual SEO landing pages targeting the pass-the-phone search intent (/moral-dilemma-game, /it/gioco-dilemmi-morali, doc-2 organic discovery experiment) are kept - their CTA is repointed to Evaluation instead of being deleted, to avoid forfeiting already-indexed SEO surface. Implementation tracked in TASK-173.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Decided: add a bridge CTA from Pass-the-Phone into Evaluation/Challenge, de-emphasize the mode on the homepage, or explicitly keep it as-is for a stated reason
<!-- AC:END -->
