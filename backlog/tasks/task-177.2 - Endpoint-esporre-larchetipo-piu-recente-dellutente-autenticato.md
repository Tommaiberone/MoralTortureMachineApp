---
id: TASK-177.2
title: 'Endpoint: esporre l''archetipo piu'' recente dell''utente autenticato'
status: Done
assignee: []
created_date: '2026-08-10 09:33'
updated_date: '2026-08-10 10:02'
labels:
  - backend
dependencies: []
parent_task_id: TASK-177
priority: medium
type: feature
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nessun endpoint oggi restituisce al frontend l'archetipo/profilo piu' recente del chiamante - get_latest_profile_for_anonymous_user (backend_fastapi.py:694) esiste gia' e usa l'indice OwnerIndex su moral_profiles (nessuna nuova infra), ma e' usato solo internamente per il gate TASK-136. Per un utente autenticato, risolvere prima i sub -> anonymous_user_id collegati tramite le righe claim-lock esistenti (stesso pattern gia' usato da GET /users/export / _profiles_for_anonymous_ids, backend_fastapi.py:1620), poi prendere il profilo piu' recente tra tutti. Nuovo endpoint autenticato (es. GET /users/me/archetype o esteso su GET /auth/me) - decidere in implementazione quale sia piu' pulito lato frontend. Nessuna nuova tabella/indice richiesta.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un endpoint autenticato restituisce l'archetipo corrente (nome, emoji, colore, descrizione, strength, blindSpot) per l'utente loggato, risolvendo correttamente eventuali piu' anonymous_user_id collegati allo stesso account
- [x] #2 Se l'utente non ha mai completato un test, l'endpoint risponde in modo esplicito (es. archetipo null), non con un errore
- [x] #3 Test backend aggiunti/aggiornati; nessuna nuova tabella o GSI creata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added GET /users/me/archetype (backend_fastapi.py): resolves every anonymous_user_id claimed to the account via the existing claim-lock rows (_claimed_anonymous_ids, same as /users/export), queries moral_profiles.OwnerIndex (no new infra), returns the most recently created still-valid profile's archetype recomputed live (never cached, per ADR-072). Returns {archetype: null} when the account has never completed a test. 3 new backend tests (MyLatestArchetypeTests), full suite 174/174 passing. Safe to deploy independently - no new infra.
<!-- SECTION:NOTES:END -->
