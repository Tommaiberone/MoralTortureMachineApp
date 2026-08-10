---
id: TASK-69
title: Aggiungere API test analytics profili challenge auth entitlements
status: To Do
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-10 10:27'
labels:
  - m10-quality
  - testing
  - api
dependencies:
  - TASK-28
  - TASK-35
  - TASK-53
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coprire happy path, auth, idempotenza, validazione e failure/retry per le API core man mano che arrivano.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni API core ha test autorizzazione e schema
- [ ] #2 Retry e idempotenza sono coperti
- [ ] #3 Test non usano risorse AWS prod
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Routine serale 2026-08-01: lasciato in To Do. Analytics/profili/challenge/auth hanno gia' buona copertura (test_analytics_models.py, test_duel.py, test_users.py - schema, autorizzazione, idempotenza, nessuna risorsa AWS reale). La parte 'entitlements' dipende pero' da TASK-53 (Backlog, non Done) che non esiste ancora come API: niente da testare finche' TASK-53 non e' implementato. Riprendere quando TASK-53 sara' Done.

Full-app walkthrough (2026-08-10, post-TASK-177) found 11 endpoints in backend_fastapi.py with zero direct test coverage (verified by checking both HTTP-string references and direct function-name imports across backend/tests/*.py): GET / (root), GET /robots.txt, GET /auth/me (its helpers upsert_user_record/require_authenticated_user are tested, the handler itself isn't), POST /users/claim-anonymous-data (same - claim_anonymous_user_id is tested, the handler isn't), GET /health, POST /analytics/events, GET /admin/analytics/overview (only its rate-limit-rule mapping is tested), POST /vote, GET /get-dilemma, POST /generate-dilemma, GET /get-story-flow, POST /story-node-vote. Concrete starting list for this task's AC1.
<!-- SECTION:NOTES:END -->
