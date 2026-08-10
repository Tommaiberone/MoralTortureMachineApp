---
id: TASK-175
title: >-
  PartyRoomScreen keeps polling after a fatal 404/410 room error instead of
  stopping
status: Done
assignee: []
created_date: '2026-08-10 08:03'
updated_date: '2026-08-10 08:35'
labels:
  - bug
  - frontend
  - party-room
dependencies: []
priority: low
type: bug
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The polling effect in PartyRoomScreen.jsx (frontend/src/screens/PartyRoomScreen.jsx:98-116) only clears its setInterval when fetchRoom() returns data with status === 'completed'. On a 404/410, fetchRoom (line 74-94) sets fatalError and returns null instead, so the interval is never cleared and the screen keeps polling GET /party-rooms/{room_code} every POLL_INTERVAL_MS (1.5s) indefinitely, even though the UI is already showing a terminal 'room not found'/'room expired' message and nothing will ever change. Distinct from TASK-148 (Done), which only covers the catch block for network errors/non-404/410 non-ok responses and explicitly leaves 404/410 to this separate fatalError branch. Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 9 alert rows for (404, /party-rooms/{room_code}) on 2026-08-08/09, in tight multi-participant bursts (several distinct clients hitting 404 within ~1-2s of each other), consistent with a room that stopped existing while multiple participants' screens were still open and polling. Root cause of the underlying 404 itself is unclear (TTL is 6h, unlikely for an active room; could be manual testing) but the polling-never-stops behavior is a clear, independently fixable bug regardless of why the room disappeared - it wastes API/Lambda calls for as long as the tab stays open on a dead room.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The polling interval is cleared once fetchRoom sets a fatal 404/410 error, the same way it already stops on status === 'completed'
- [x] #2 No further GET /party-rooms/{room_code} requests are made after the fatal error is shown
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PartyRoomScreen.jsx: added fatalRef, set alongside setFatalError in fetchRoom's 404/410 branch; the polling useEffect now clears its interval when either room.status === 'completed' OR fatalRef.current is true, so a dead room stops being polled instead of hammering the API forever. Verified with pnpm lint + pnpm build:prod (both clean); no frontend test runner exists yet (TASK-170).
<!-- SECTION:NOTES:END -->
