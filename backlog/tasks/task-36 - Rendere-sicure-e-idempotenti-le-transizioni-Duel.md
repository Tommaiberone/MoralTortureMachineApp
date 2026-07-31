---
id: TASK-36
title: Rendere sicure e idempotenti le transizioni Duel
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:16'
labels:
  - m4-duel
  - backend
  - security
  - testing
dependencies:
  - TASK-35
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idempotenza per join, submit e complete; blocco modifica risposte; protezione da replay e reveal anticipato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Retry non duplica partecipanti o risposte
- [x] #2 Risposte immutabili dopo comparison unlock
- [x] #3 Opponent answers restano nascoste fino al completamento richiesto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Idempotenza reale a livello DynamoDB (non solo controlli applicativi che potrebbero avere race condition): join usa ConditionExpression su anonymousUserId (stesso invitato = no-op sicuro, invitato diverso = 409 ConditionalCheckFailedException); submit usa ConditionExpression attribute_not_exists(submittedAt) sull'update_item (seconda submit = 409, mai sovrascrive risposte immutabili). Opponent data mai esposta prima dell'unlock: open_challenge (teaser) e la fase di risposta non rivelano mai le medie/l'archetipo dell'altro partecipante; compare_challenge richiede status=='completed' (409 altrimenti). Test dedicati per retry-non-duplica (join ripetuto, submit ripetuto) e per l'esposizione dati in test_duel.py.
<!-- SECTION:NOTES:END -->
