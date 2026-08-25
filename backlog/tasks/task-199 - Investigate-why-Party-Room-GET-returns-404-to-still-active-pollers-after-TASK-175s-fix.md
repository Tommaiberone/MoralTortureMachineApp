---
id: TASK-199
title: >-
  Investigate why Party Room GET returns 404 to still-active pollers after
  TASK-175's fix
status: Done
assignee: []
created_date: '2026-08-24 15:38'
updated_date: '2026-08-25 11:19'
labels:
  - bug
  - backend
  - party-room
dependencies: []
priority: low
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-175 (Done) stopped PartyRoomScreen from hammering a dead room forever, but explicitly left the root cause of the underlying 404 unconfirmed ('TTL is 6h, unlikely for an active room; could be manual testing', ADR-077). Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 10 more (404, /party-rooms/{room_code}) alert rows since TASK-175 shipped, still occasionally in multi-participant bursts (2-3 distinct clients within ~1-2s of each other, e.g. 2026-08-16T14:12:39-41), consistent with a shared room object disappearing while other participants were still actively polling it. Candidate mechanism found while reading the code for this sweep: _delete_linked_account_data -> _delete_party_data (backend_fastapi.py:1998-2014, called from account deletion) deliberately deletes the entire shared party_rooms_table row (and all its participants) whenever ANY single participant who contributed to that room deletes their account - by design, per the function's own docstring ('deliberately removes an entire shared Duel/Party object when the caller contributed to it'). If that is what is happening, every other still-connected participant would see a bare, unexplained 404 instead of a message indicating a participant left/deleted their account and ended the room. This is a plausible mechanism inferred from the code, not confirmed against real request data - the TTL and manual-testing explanations from TASK-175 remain equally possible.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Confirm or rule out the account-deletion cascade as the actual mechanism behind (some of) these 404s, e.g. by correlating a future occurrence's timing with account-deletion activity
- [x] #2 If confirmed as a real user-facing scenario, decide whether surviving participants should see a distinct, non-alarming message instead of a generic 404/room-not-found error
- [ ] #3 If ruled out or judged too low-volume to matter, close with that reasoning recorded
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deeper pass (2026-08-25) narrowed the mechanism to near-certainty from code + git history: the retention-sweep path is ruled out (Cognito/login only shipped 2026-07-29, no account can be near the 12-month threshold yet), leaving explicit DELETE /users/me as the only mechanism capable of producing these 404s today - most likely the owner's own manual Party Room testing, not a real end user. See the full reasoning in this task's notes above and in ADR-088.

Found this conflicts with ADR-073's literal "whole shared object removed" wording (which covers Party Room too, not just Duel) - flagged to the user before implementing rather than silently overriding a confirmed decision. User chose the tombstone approach, which satisfies ADR-073's actual privacy rationale (zero participant/derived data survives) while fixing the confusing-404 UX.

IMPLEMENTED: _delete_party_data (backend_fastapi.py) still deletes every party_participants row exactly as before; the room row is now replaced with a minimal {roomCode, status: "participant_left", expirationTime: now+15min} tombstone instead of delete_item. get_room_or_404 raises 410 ("A participant left the platform and this game has ended") for that status before any caller can read fields a real room would have, mirroring the existing revoked/expired-challenge 410 pattern (ADR-038). PartyRoomScreen.jsx's existing 404/410 fatal-stop-polling branch (TASK-175) already covers this; it now also matches the specific detail string to show a distinct party.roomParticipantLeft message (en.json only, per the it.json-drift exception), falling back to the generic roomExpired copy for any other 410 - including for an older, not-yet-rebuilt Android client, which degrades gracefully rather than breaking. No API contract broke, so no Android rebuild warning applies.

AC#3 does not apply: it was the alternative branch for "ruled out or too low-volume to matter, close without a fix" - the mechanism was instead confirmed enough to act on and fixed, per AC#1/#2. Left unchecked deliberately, not an oversight.

Tests: test_party_room.py (tombstone shape has no room-data fields; polling a tombstoned room raises 410 with the expected detail) and test_users.py's existing account-deletion cascade test (updated from asserting a hard delete_item to asserting the new tombstone put_item). Full backend suite: 184/184 passing. Frontend: pnpm lint clean, pnpm build:prod clean.
<!-- SECTION:NOTES:END -->
