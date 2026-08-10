---
id: TASK-178
title: No catch-all/404 route - an unmatched path renders a blank page
status: Done
assignee: []
created_date: '2026-08-10 10:24'
updated_date: '2026-08-10 13:38'
labels:
  - frontend
  - ux
dependencies: []
priority: medium
type: bug
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
frontend/src/App.jsx has no catch-all Route in its <Routes> block. Any unmatched path (typo, stale bookmark, a crawler hitting the dead /story-mode path) renders nothing inside <Suspense>/<Routes> - a blank white page with zero navigation, not even a generic 'page not found' with a way back home. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Navigating to any unmapped path shows a not-found screen with a way back to the home screen, instead of a blank page
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Aggiunta NotFoundScreen.jsx (lazy) + Route path='*' in fondo a App.jsx. Copy in tono con l'app, chiavi notFound.* in en.json.
<!-- SECTION:NOTES:END -->
