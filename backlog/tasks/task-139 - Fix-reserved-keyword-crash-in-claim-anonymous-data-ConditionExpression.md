---
id: TASK-139
title: Fix reserved-keyword crash in claim-anonymous-data ConditionExpression
status: Done
assignee: []
created_date: '2026-08-05 07:53'
updated_date: '2026-08-05 07:58'
labels:
  - regression
  - backend
  - bug
  - m1-auth
dependencies: []
priority: high
type: bug
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
POST /users/claim-anonymous-data returns 500 in production: DynamoDB rejects the PutItem ConditionExpression in claim_anonymous_user_id() (backend_fastapi.py ~line 396) because it references the bare attribute name 'sub', which is a DynamoDB reserved keyword ('attribute_not_exists(sub) OR ownerSub = :owner'). Every call to this endpoint fails, so no authenticated user can actually link their anonymous activity to their account even though TASK-138 just wired the frontend caller. Fix: use ExpressionAttributeNames for the 'sub' attribute name, same pattern already used elsewhere in this file (e.g. #status).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 attribute_not_exists check on the users table claim-lock item no longer references the literal attribute name 'sub' in a ConditionExpression string
- [x] #2 POST /users/claim-anonymous-data succeeds (200) for a first-time claim and remains idempotent/409-on-conflict as before
- [x] #3 backend unit tests covering this endpoint pass, including a case that would have caught the reserved-keyword ValidationException
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause: DynamoDB rejects any ConditionExpression that names the reserved keyword 'sub' outside an ExpressionAttributeNames placeholder (production 500: 'Attribute name is a reserved keyword; reserved keyword: sub'). claim_anonymous_user_id()'s claim-lock PutItem in backend_fastapi.py used attribute_not_exists(sub) OR ownerSub = :owner directly. Fixed by adding ExpressionAttributeNames={'#sub': 'sub'} and rewriting the expression as attribute_not_exists(#sub) OR ownerSub = :owner, same placeholder pattern already used elsewhere in the file (#status). Added a regression test in backend/tests/test_users.py asserting the ConditionExpression never contains the bare literal attribute_not_exists(sub) and that the placeholder correctly maps to 'sub' in ExpressionAttributeNames - this test suite mocks the DynamoDB table like the rest of the file, so it does not exercise DynamoDB's own reserved-word validation, but it pins the fix and fails if the code regresses to the bare literal. Verified with a throwaway venv (backend/requirements.txt): all 10 tests in test_users.py pass, and the full suite (134 tests) still passes. This is the second finding in the same code path this week after TASK-138 wired the frontend caller: the endpoint was reachable and idempotent-by-mock in tests, but had never actually been exercised against real DynamoDB, so this class of failure (client-side mocks are permissive about reserved words; DynamoDB itself is not) stayed invisible until production traffic hit it.
<!-- SECTION:NOTES:END -->
