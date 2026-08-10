---
id: TASK-186
title: >-
  Inconsistent error handling across the legacy endpoints (miscategorized 500s,
  leaked exception text, dead health status code)
status: To Do
assignee: []
created_date: '2026-08-10 10:26'
labels:
  - backend
dependencies: []
priority: medium
type: bug
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three related error-handling gaps found in backend_fastapi.py: (1) POST /vote (~line 3619) is missing the 'except HTTPException: raise' guard every sibling endpoint (get_dilemma, generate_dilemma, analyze_results, get_story_flow, story_node_vote) has, so its own intentional 'raise HTTPException(400, ...)' for an invalid vote type gets caught by the broad except Exception and re-wrapped as a 500 - both a wrong status code for the client and a false-positive candidate for the ops-alerts-sweep skill. (2) Six legacy endpoints (vote, get-dilemma, generate-dilemma, analyze-results, get-story-flow, story-node-vote) return detail=f'An error occurred: {str(e)}', leaking raw internal exception text to the client, unlike newer endpoints (e.g. /analytics/events) which return a generic message. (3) GET /health (~line 3070) computes status_code = 200 if healthy else 503 but never actually applies it to the JSONResponse, so a failing health check still returns HTTP 200 - defeating the point of a monitored health endpoint. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /vote returns 400 for an invalid vote type, not a 500
- [ ] #2 The six legacy endpoints no longer return raw exception text in the response body
- [ ] #3 GET /health returns 503 (not 200) when its own health computation says unhealthy
<!-- AC:END -->
