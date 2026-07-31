---
id: TASK-13
title: Implementare claim idempotente dei dati anonimi
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:20'
labels:
  - m1-auth
  - auth
  - backend
  - database
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere POST /users/claim-anonymous-data e collegare in modo sicuro attività e risultati anonimi all'account.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ripetere il claim non duplica né perde dati
- [x] #2 Il client non invia email come identificatore
- [x] #3 Conflitti tra dispositivi hanno comportamento testato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POST /users/claim-anonymous-data: richiede autenticazione, upsert del record utente, poi claim_anonymous_user_id() con item claim-lock a chiave singola-tabella (sub=anon#<id>, ConditionExpression su ownerSub) per idempotenza e rilevazione conflitti. Ripetere il claim dallo stesso account e' un no-op sicuro; claim da un account diverso su un anonymousUserId gia' rivendicato ritorna 409 invece di sovrascrivere silenziosamente. Il body accetta solo anonymousUserId, mai email (l'owner viene sempre dal token verificato). 3 nuovi test in backend/tests/test_users.py (claim iniziale, ripetizione idempotente, conflitto tra device), 34/34 test totali verdi.
<!-- SECTION:NOTES:END -->
