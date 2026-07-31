---
id: TASK-12
title: Creare Users table e dipendenze auth FastAPI
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 10:46'
labels:
  - m1-auth
  - auth
  - backend
  - database
dependencies:
  - TASK-11
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Persistenza utenti keyed by Cognito sub e dipendenze FastAPI per autenticazione opzionale e obbligatoria.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users usa Cognito sub immutabile come chiave
- [x] #2 Endpoint anonimi continuano a funzionare senza token
- [x] #3 Endpoint protetti distinguono 401 e 403 correttamente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tabella users (hash_key=sub) in Terraform, PROVISIONED 1/1 RCU-WCU nel Free Tier gratuito (non PAY_PER_REQUEST come le tabelle legacy), PITR disabilitato in attesa della decisione TASK-89. Aggiunte get_optional_user() (None se token assente/non valido, mai propaga eccezione) e upsert_user_record() (UpdateItem idempotente con if_not_exists su createdAt) in backend_fastapi.py, collegate a /auth/me. 4 nuovi test in backend/tests/test_users.py, 31/31 verdi in totale. Terraform validato ma non applicato (nessun terraform apply eseguito).
<!-- SECTION:NOTES:END -->
