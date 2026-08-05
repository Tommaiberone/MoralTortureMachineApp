---
id: TASK-143
title: >-
  AI analysis failure hides archetype, Challenge CTA and share-card buttons
  entirely
status: To Do
assignee: []
created_date: '2026-08-05 09:05'
labels:
  - bug
  - frontend
  - backend
  - ai
  - growth
dependencies: []
priority: high
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backend_fastapi.py:3067-3069 computes the deterministic archetype (assign_archetype) BEFORE calling Groq and its own comment says archetype assignment must hold even when the AI analysis fails - but the return statement that includes archetype in the response body (line 3176) only executes on the success path; every except block (3179-3189) raises HTTPException with no body at all, silently discarding the already-computed archetype. Frontend compounds this: ResultsScreen.jsx:92-94 throws on any non-ok response BEFORE the response.status===429 check at line 99 even runs, so the dedicated rate_limit_error message is dead code and archetype (useState(null), line 21) never gets set on any failure. Since ResultsScreen.jsx:295 and :320 gate the share-card download buttons and the entire Challenge a friend block behind {archetype &amp;&amp;...}, any Groq failure (rate limit or otherwise) silently removes the apps core growth loop, not just the AI text - directly contradicting the doc-1/doc-2 constraint that the core result and duel flow must work when Groq is unavailable. Verified by reading both files directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /analyze-results returns the deterministic archetype in its response body even when the Groq call fails (429 or any other error), not only on the AI success path
- [ ] #2 ResultsScreen.jsx checks response.status===429 before throwing on a non-ok response, so the rate-limit-specific message is actually reachable
- [ ] #3 When /analyze-results fails, the user still sees their archetype and can still use the Challenge a friend flow and download share cards - only the AI-generated text is affected
<!-- AC:END -->
