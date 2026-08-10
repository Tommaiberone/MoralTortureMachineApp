---
id: TASK-188
title: Duplicated 90-day TTL literal and dead hardcoded Groq model string
status: Backlog
assignee: []
created_date: '2026-08-10 10:27'
labels:
  - backend
  - cleanup
dependencies: []
priority: low
type: chore
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backend_fastapi.py:862 and :3128 both inline the analytics 90-day TTL as the literal 90 * 24 * 60 * 60, unlike every sibling retention window (OPS_ERROR_ALERT_TTL_SECONDS, CHALLENGE_TTL_SECONDS, ACCOUNT_RETENTION_SECONDS, PROFILE_RETENTION_SECONDS, PARTY_ROOM_TTL_SECONDS) which are named top-of-file constants - doc-1 documents this as a real business rule, so editing one call site without the other is a real drift risk. Separately, 'model': 'llama-3.1-8b-instant' is hardcoded identically at 4 call sites (2402, 2942, 3841, 3977) even though call_groq_api_with_fallback always overwrites payload['model'] from MODEL_FALLBACK_CHAIN, making the literal dead; only 2 of the 4 sites have a comment admitting this, so a future reader could mistake the other 2 as meaningful. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The 90-day analytics TTL is a single named constant, referenced from both call sites
- [ ] #2 The dead 'llama-3.1-8b-instant' literal is either removed from all 4 call sites or consistently commented as overridden
<!-- AC:END -->
