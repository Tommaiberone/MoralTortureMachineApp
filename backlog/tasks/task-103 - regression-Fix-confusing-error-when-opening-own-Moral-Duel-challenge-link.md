---
id: TASK-103
title: '[regression] Fix confusing error when opening own Moral Duel challenge link'
status: Done
assignee: []
created_date: '2026-07-31 14:50'
updated_date: '2026-07-31 14:51'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live production bug reported by the user: opening your own just-created challenge link and clicking Accept shows a generic [ CHALLENGE UNAVAILABLE ] / Something went wrong error, because the backend correctly rejects joining your own challenge with a 400 but the frontend only ever surfaced a generic unknown-error message for any non-OK /join response. CloudWatch logs confirmed a real user's join request for a live challenge token returned 400 right after a successful open (200), consistent with self-joining.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend GET /challenges/{token} exposes isOwnChallenge so the creator viewing their own link never sees an Accept button
- [x] #2 Frontend teaser screen shows a share-your-link view (WhatsApp/copy link) instead of Accept when isOwnChallenge is true
- [x] #3 Frontend still surfaces a specific, non-generic message if a 400 from /join is somehow still reached (defense in depth)
- [x] #4 Backend and frontend automated tests updated/passing; pnpm lint and build pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Version bump: 1.4.0 (versionCode 10) -> 1.4.1 (versionCode 11), patch release for this backward-compatible bugfix. Not yet deployed/built; deploy on explicit user request.
<!-- SECTION:NOTES:END -->
