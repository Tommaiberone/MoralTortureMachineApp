---
id: TASK-182
title: 'A handful of hardcoded button labels (VS, WhatsApp, Facebook) bypass i18next'
status: Done
assignee: []
created_date: '2026-08-10 10:25'
updated_date: '2026-08-10 13:39'
labels:
  - frontend
  - i18n
dependencies: []
priority: low
type: chore
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A few small, isolated strings bypass t(): ChallengeCompareScreen.jsx:125 hardcodes 'VS' between the two archetype cards; ChallengeLandingScreen.jsx:337 and ResultsScreen.jsx:313,346 hardcode 'WhatsApp' share button labels; ResultsScreen.jsx:361 hardcodes 'Facebook'. Low impact (brand names/short labels, app is EN-only per TASK-101 anyway) but inconsistent with the rest of the codebase's i18next convention. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 VS/WhatsApp/Facebook button labels are sourced from i18next translation keys like the rest of the app's copy
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VS (ChallengeCompareScreen), WhatsApp (ChallengeLandingScreen + 2x ResultsScreen), Facebook (ResultsScreen) ora passano da t(): challengeCompare.vs, challenge.whatsapp, results.whatsapp, results.facebook.
<!-- SECTION:NOTES:END -->
