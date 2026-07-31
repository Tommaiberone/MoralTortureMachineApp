---
id: TASK-17
title: Applicare rate limit alle operazioni auth e write
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:27'
labels:
  - m1-auth
  - security
  - backend
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Limitare operazioni adiacenti al signup e scritture autenticate con risposte e retry sicuri.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le soglie sono configurabili e documentate
- [x] #2 Le risposte 429 includono retry coerente
- [x] #3 Letture pubbliche normali non vengono penalizzate
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nuovo bucket 'auth_write' nel burst guard esistente (zero-cost, in-memory, gia' usato da 'ai' e 'analytics_ingest'): applicato a /users/claim-anonymous-data, /users/me (DELETE), /auth/me. Soglia configurabile via ABUSE_AUTH_WRITE_REQUESTS_PER_MINUTE (default 10/minuto, Terraform variable con validazione e default documentati). Riusa il meccanismo 429+Retry-After gia' esistente, invariato per le altre regole; le letture pubbliche (dilemmi, risultati anonimi) restano soggette solo alla regola 'global' come prima, non penalizzate dalla nuova regola. Nuovo test in test_analytics_models.py che verifica il bucket assegnato ai tre path; 37/37 test totali verdi.
<!-- SECTION:NOTES:END -->
