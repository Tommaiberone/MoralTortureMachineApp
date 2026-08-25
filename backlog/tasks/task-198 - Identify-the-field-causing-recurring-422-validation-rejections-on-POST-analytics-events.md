---
id: TASK-198
title: >-
  Identify the field causing recurring 422 validation rejections on POST
  /analytics/events
status: Blocked
assignee: []
created_date: '2026-08-24 15:38'
updated_date: '2026-08-25 11:18'
labels:
  - bug
  - frontend
  - backend
  - analytics
dependencies: []
priority: low
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-174 (Done) stopped the client from retrying/blocking its queue on a 422, but did not identify why individual batches fail AnalyticsEvent schema validation (backend_fastapi.py:1065) in the first place. Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 67 more (422, /analytics/events) alert rows accumulated *after* TASK-174's fix shipped (2026-08-10), spread steadily at roughly 2-13/day through 2026-08-24 with no clear growth or decay trend - not a retry storm (that pattern is confirmed fixed), but a real, sustained baseline of individual events being permanently dropped. The exact failing field cannot be read from CloudWatch today since the request body is intentionally never logged (privacy policy) per TASK-174's own investigation. Candidate schema constraints worth checking first: eventName's strict pattern (^[a-z][a-z0-9_]+$), eventId's UUID v4-shaped pattern, occurredAt's bounded epoch-millis range, the utm dict's allowed-key allowlist, or a stale app_version/client sending a shape an older schemaVersion no longer accepts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A privacy-safe way to identify which field(s) actually fail validation is implemented or proposed (e.g. logging only the Pydantic error type/field path, never the value or full body)
- [ ] #2 Root cause of at least the dominant failure mode is identified from real data
- [ ] #3 Decision recorded on whether the identified cause warrants a client-side or schema fix, or is accepted as expected loss
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deeper pass (2026-08-25) ruled out several candidates (challenge_token, PII-like patterns, eventName, language - see prior notes) and identified occurredAt clock skew as the most plausible remaining candidate, but could not confirm further from code alone.

IMPLEMENTED for AC#1: added @app.exception_handler(RequestValidationError) in backend_fastapi.py, registered right after the notify_ops_of_errors middleware. Logs only error["loc"] (which field) and error["type"] (which constraint), never error["msg"]/error["input"] which can echo the rejected value back - keeps the no-request-body-logging privacy rule intact. Returns the exact same {"detail": exc.errors()} / 422 shape FastAPI's default handler already produced, so no existing client behavior changes. This also corrects a latent inaccuracy in notify_ops_of_errors' generic alert detail ("See CloudWatch logs for the request detail") - for a 422 specifically, there was previously nothing in CloudWatch to see; there is now. Tests: ValidationExceptionHandlerTests in test_ops_error_notifications.py, asserting the log line contains only loc/type (never a planted msg/input value) and that the response body/status still match FastAPI's default shape. Full backend suite: 184/184 passing. See ADR-089.

AC#2/#3 cannot be completed yet - they require an actual production 422 to hit this new logging and a CloudWatch check afterward, which hasn't happened since this deployed. Status set to Blocked (external impediment: waiting on the next real occurrence) rather than Done, per CLAUDE.md's rule against closing a task on narrower criteria than it actually promises. Re-open/continue once a real log line is available - check CloudWatch for "Validation error on POST /analytics/events" and update this task with the actual loc/type found.
<!-- SECTION:NOTES:END -->
