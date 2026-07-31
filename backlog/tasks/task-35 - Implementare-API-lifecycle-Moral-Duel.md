---
id: TASK-35
title: Implementare API lifecycle Moral Duel
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:16'
labels:
  - m4-duel
  - backend
  - api
dependencies:
  - TASK-34
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Endpoint create, open, join, submit, complete, compare e rematch con contratti versionati.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni transizione di stato è validata
- [x] #2 Gli errori expired, revoked e completed sono distinti
- [x] #3 Il flusso funziona senza login per l'invitato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Endpoint completi: POST /profiles, GET /profiles/{id}, GET /dilemmas/by-ids, POST /challenges, GET /challenges/{token} (open), POST /challenges/{token}/join, POST /challenges/{token}/submit (completa implicitamente), GET /challenges/{token}/compare, POST /challenges/{token}/rematch, POST /challenges/{token}/revoke. Ogni transizione valida lo stato corrente (ensure_challenge_is_actionable, controlli su status prima di join/submit/compare/rematch/revoke). Errori distinti: 410 per expired/revoked (messaggi separati), 409 per stati-conflitto (gia' completata, non ancora completata, seconda submit), 403 per non-partecipante, 404 per token/profilo inesistente. Nessun endpoint richiede autenticazione: solo X-Anonymous-User-Id (require_anonymous_user_id), l'invitato non deve mai registrarsi. 27 test in backend/tests/test_duel.py.
<!-- SECTION:NOTES:END -->
