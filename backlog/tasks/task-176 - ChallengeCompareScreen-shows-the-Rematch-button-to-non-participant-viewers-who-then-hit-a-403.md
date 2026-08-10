---
id: TASK-176
title: >-
  ChallengeCompareScreen shows the Rematch button to non-participant viewers,
  who then hit a 403
status: Done
assignee: []
created_date: '2026-08-10 08:03'
updated_date: '2026-08-10 08:35'
labels:
  - bug
  - frontend
  - duel
dependencies: []
priority: low
type: bug
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GET /challenges/{token}/compare (backend_fastapi.py:2271) has no participant check by design - it is meant to be viewable by anyone with the token, including non-participants who received a shared comparison link. But ChallengeCompareScreen.jsx unconditionally renders the Rematch button (line 199) to every viewer of that page, regardless of whether they were creator/invitee. POST /challenges/{token}/rematch (backend_fastapi.py:2351) does require the caller to have been a participant and returns 403 'You were not part of this challenge' otherwise (line 2367). Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 2 alert rows for (403, /challenges/{token}/rematch) on 2026-08-05 and 2026-08-09, consistent with a non-participant viewer clicking a button that was never going to work for them. Per ADR-068, this status/path combination was deliberately left un-suppressed as 'genuinely ambiguous without route-specific knowledge' for this skill to triage - this is that triage. Low volume/impact, but a clear, fixable gap: the button should only be shown to the actual creator/invitee.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Rematch button/CTA on ChallengeCompareScreen is hidden (or disabled with an explanatory state) for a viewer who was not the creator or invitee of the challenge
- [x] #2 Creator/invitee viewers keep the existing Rematch flow unchanged
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Backend: GET /challenges/{token}/compare now optionally reads X-Anonymous-User-Id (never required, page stays publicly viewable) and returns isParticipant (creator or invitee match). Frontend: ChallengeCompareScreen only renders the compare-actions block (Rematch button/link/login-CTA) when comparison.isParticipant is true; non-participant viewers no longer see a button that was always going to 403. Added backend tests (test_is_participant_true_for_creator_and_invitee, test_is_participant_false_for_non_participant_or_missing_header) - full backend suite 169/169 passing. Verified with pnpm lint + pnpm build:prod (both clean).
<!-- SECTION:NOTES:END -->
