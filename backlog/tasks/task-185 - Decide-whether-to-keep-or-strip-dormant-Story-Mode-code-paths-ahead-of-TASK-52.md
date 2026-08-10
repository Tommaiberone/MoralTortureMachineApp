---
id: TASK-185
title: Decide whether to keep or strip dormant Story Mode code paths ahead of TASK-52
status: Open Points
assignee: []
created_date: '2026-08-10 10:26'
labels:
  - frontend
  - decision
dependencies: []
priority: low
type: task
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Story Mode is hidden but not removed: HomeScreen.jsx:104-113 has a commented-out button block, TutorialScreen.jsx:59-84 keeps a fully-wired but unreachable 'story' mode branch (nothing sets mode:'story' anymore) that targets /story-mode - a route with no matching entry in App.jsx (also commented out there), StoryModeScreen.jsx (293 lines) is fully orphaned, and public/robots.txt:8 still has 'Allow: /story-mode', actively inviting crawlers to a dead path. Backend: GET /get-story-flow/POST /story-node-vote are also dormant and (per the same walkthrough) missing the language validation every sibling endpoint has. TASK-52 (Backlog, low priority, depends on TASK-50/53) plans to revive Story Mode later as episodic premium content, so this may be intentional dormant scaffolding rather than plain dead code - worth a call on whether to keep it as a head start for TASK-52 or strip it now and let that task rebuild fresh, rather than deciding unilaterally during a cleanup pass. One safe action either way, no decision needed: removing the robots.txt entry, since it currently sends crawlers to a route that renders nothing (see the related no-404-route task). Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decision is recorded: keep the dormant Story Mode code as-is for TASK-52, or strip it now
<!-- AC:END -->
