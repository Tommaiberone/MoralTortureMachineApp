---
id: TASK-174
title: >-
  Frontend analytics queue retries a permanently-invalid (422) batch forever,
  blocking later events
status: Done
assignee: []
created_date: '2026-08-10 08:03'
updated_date: '2026-08-10 08:35'
labels:
  - bug
  - frontend
  - analytics
dependencies: []
priority: low
type: bug
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
flushAnalytics (frontend/src/utils/analytics.js:87-111) treats every non-ok response the same: on failure it always re-queues the failed batch at the front of the in-memory queue (queue = [...events, ...queue]) and retries every FLUSH_INTERVAL_MS (5s). A 422 is a Pydantic validation rejection (AnalyticsEvent schema, backend_fastapi.py:1046) that will never succeed on retry, unlike a network blip or a 5xx. Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 14 alert rows for (422, /analytics/events) across 2026-08-06 to 2026-08-08, clustered in tight bursts consistent with one stuck client retrying the same bad batch repeatedly. Two consequences: (1) wasted Lambda/API Gateway invocations for a request guaranteed to keep failing, and (2) because the failed batch is re-added to the *front* of the queue, it permanently blocks every subsequent trackEvent() in that browser session from ever being flushed - silent analytics data loss for the rest of the session. The exact field that fails validation could not be determined from CloudWatch, since the request body is intentionally never logged (privacy policy).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On a 4xx response (client-side validation rejection), the offending batch is dropped/logged instead of being re-queued for retry
- [x] #2 On a network error or 5xx response, the existing retry-and-requeue behavior is preserved
- [x] #3 A batch that keeps failing no longer blocks later, valid events from being flushed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
flushAnalytics (frontend/src/utils/analytics.js) now only re-queues a failed batch on 429/5xx/network error; any other 4xx (e.g. 422 schema validation) is treated as a permanent rejection and dropped instead of blocking the queue forever. Verified with pnpm lint + pnpm build:prod (both clean); no frontend test runner exists yet (TASK-170).
<!-- SECTION:NOTES:END -->
