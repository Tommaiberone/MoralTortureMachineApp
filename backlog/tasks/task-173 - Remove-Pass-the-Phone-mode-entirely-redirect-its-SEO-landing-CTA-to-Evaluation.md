---
id: TASK-173
title: >-
  Remove Pass-the-Phone mode entirely; redirect its SEO landing CTA to
  Evaluation
status: Done
assignee: []
created_date: '2026-08-07 11:00'
updated_date: '2026-08-07 11:07'
labels: []
dependencies: []
references:
  - >-
    backlog/tasks/task-161 -
    Decide-whether-to-give-Pass-the-Phone-a-bridge-into-the-challenge-loop-or-de-emphasize-it.md
priority: high
type: chore
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-161 (Open Points, now Done): the user decided to remove Pass-the-Phone entirely rather than bridge or de-emphasize it. Scope, confirmed by grepping the whole repo for pass-the-phone/PassThePhone/passThePhone (27 files hit): the screen itself, its route, its homepage entry point, its tutorial steps, its i18n strings (en.json only, per the TASK-101 it.json drift exception - it.json is left untouched), its mentions in structured data (FAQ/HowTo/featureList), README/ANDROID_GUIDE/SEO_IMPLEMENTATION docs, and sitemap.xml.

Kept, per explicit user decision: the two bilingual SEO landing pages for the pass-the-phone search intent (/moral-dilemma-game, /it/gioco-dilemmi-morali - doc-2 organic discovery experiment, cluster of 3). Their mode switches from passThePhone to evaluation and their CTA now starts the Evaluation test instead of a route that no longer exists - this is not a content rewrite, only the destination/branding of a mode that no longer exists changes. The bare /pass-the-phone URL (indexed directly in sitemap.xml, separate from the two landings) redirects client-side to /evaluation-dilemmas rather than becoming a dead route, since it is itself an indexed URL.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PassThePhoneScreen.jsx and PassThePhoneScreen.css are deleted; /pass-the-phone in App.jsx redirects to /evaluation-dilemmas instead of rendering a removed component
- [x] #2 HomeScreen no longer has a Pass-the-Phone/arcade button or entry point
- [x] #3 TutorialScreen has no remaining passThePhone/infinite branch (dead code removed from getTutorialSteps/getTargetRoute)
- [x] #4 AboutScreen no longer describes Pass-the-Phone as an available mode
- [x] #5 en.json has no passThePhone.* or home.infinite_*/tutorial.infinite_* keys left; it.json is untouched per the TASK-101 drift exception
- [x] #6 structuredData.js featureList/FAQ/HowTo no longer claim a Pass-the-Phone mode
- [x] #7 seoLandings.js moralDilemmaGame (EN+IT) mode is evaluation, not passThePhone, and its CTA copy no longer names a dedicated Pass-the-Phone mode; the ethicalDilemmas FAQ entry mentioning Pass the Phone mode is corrected in both locales
- [x] #8 sitemap.xml no longer lists /pass-the-phone as its own indexed URL
- [x] #9 README.md, ANDROID_GUIDE.md, SEO_IMPLEMENTATION.md no longer describe Pass-the-Phone as a current, available mode
- [x] #10 pnpm lint and pnpm build:prod pass
<!-- AC:END -->
