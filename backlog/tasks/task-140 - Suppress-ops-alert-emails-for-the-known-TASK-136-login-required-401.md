---
id: TASK-140
title: Suppress ops alert emails for the known TASK-136 login-required 401
status: Done
assignee: []
created_date: '2026-08-05 08:09'
updated_date: '2026-08-05 08:09'
labels:
  - backend
  - ops
  - m1-auth
dependencies: []
priority: medium
type: enhancement
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to TASK-139: the user reviewed the two ops-alert emails and confirmed the 401 on rematch/create/join is expected (TASK-136/ADR-063's mandatory login gate, already handled by a dedicated login CTA in the frontend), not a bug, and asked to stop receiving emails for it specifically. ADR-045 deliberately keeps notify_ops_of_errors broad (alert on every 4xx by default, since most are legitimate business outcomes) with cooldown + the ops-alerts-sweep skill as the mitigation - this adds a narrow, explicit opt-out (request.state.expected_business_error) for the one case that is known, at the moment it happens, to need no alert at all, without weakening the default for every other 4xx.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 POST /challenges/{token}/rematch, POST /challenges (create), and POST /challenges/{token}/join no longer trigger an ops_error_alerts write or SNS email for their 401 login_required response
- [x] #2 Every other 4xx/5xx response continues to trigger the existing ops alert/email behavior unchanged
- [x] #3 Backend tests cover both the suppressed case and that unflagged 4xx responses still alert
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented via a new _raise_login_required(request) helper (backend_fastapi.py) that sets request.state.expected_business_error = True before raising HTTPException(401, 'login_required'); replaced the two direct raise sites (require_authenticated_for_repeat_duel, used by create_challenge/join_challenge, and rematch_challenge) with calls to it. notify_ops_of_errors middleware now checks getattr(request.state, 'expected_business_error', False) and skips _notify_ops_of_error (both the DynamoDB write and the SNS email) when set, defaulting to alert as before when unset. Verified request.state actually propagates from the route handler back up through the real BaseHTTPMiddleware stack (not just in mocked unit tests) with a one-off TestClient script hitting POST /challenges/tok/rematch end-to-end: the flagged 401 did not call _notify_ops_of_error, while a control unflagged 404 through the same stack still did; script discarded after verification, not committed. Added/extended tests: test_ops_error_notifications.py (NotifyOpsMiddlewareExpectedErrorTests, RaiseLoginRequiredTests) and assertions on request.state.expected_business_error in test_duel.py's three existing TASK-136 401 tests (create/join/rematch). Full backend suite: 138/138 passing. Scope note: the user's ask named the rematch 401 specifically, but create_challenge and join_challenge raise the exact same login_required 401 via the same require_authenticated_for_repeat_duel gate (TASK-136/ADR-063) - suppressing only one of the three would have been an inconsistent, arbitrary carve-out of a single design intent, so all three were covered. No other 4xx/5xx category was touched; ADR-045's default-alert behavior stands everywhere else.
<!-- SECTION:NOTES:END -->
