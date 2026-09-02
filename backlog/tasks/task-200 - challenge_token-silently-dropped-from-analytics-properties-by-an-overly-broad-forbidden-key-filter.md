---
id: TASK-200
title: >-
  challenge_token silently dropped from analytics properties by an overly broad
  forbidden-key filter
status: Done
assignee: []
created_date: '2026-08-25 10:04'
updated_date: '2026-09-02 09:00'
labels:
  - bug
  - frontend
  - backend
  - analytics
dependencies: []
priority: low
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found while deepening the TASK-198 analysis (2026-08-25), not part of that task's own fix. Both analytics.js's FORBIDDEN_PROPERTY_KEYS regex (frontend) and backend_fastapi.py's validate_properties forbidden_tokens set (backend) reject any property key containing the underscore-delimited token 'token' - meant to catch accidental inclusion of things like auth_token/access_token/jwt_token. This also catches the product's own non-secret challenge_token identifier, which is deliberately shareable (it's the literal URL param of a Duel invite link) and is not in either side's explicit identifying-keys allowlist (anonymous_user_id, install_id, session_id, public_id, profile_id, room_code, previous_room_code) the way room_code/public_id are. Confirmed by running the frontend regex directly: FORBIDDEN_PROPERTY_KEYS.test('challenge_token') === true. Effect: every trackEvent() call across ~9 sites in the Duel/Challenge funnel (ChallengeCompareScreen, ChallengeLandingScreen, ResultsScreen, AccountDeleteScreen) that includes challenge_token silently loses that property before the request is ever sent - no error, just missing data - undermining TASK-40's stated goal of instrumenting/reporting the challenge funnel (e.g. can't join events across the funnel by token to build a step-by-step funnel report).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Decide whether challenge_token should be treated as safe-to-send analytics context (like room_code/public_id are explicitly NOT, being deliberately excluded) or should stay excluded for a documented reason
- [ ] #2 If it should flow through, add it to both sides' explicit identifying-keys/allow lists consistently so frontend and backend agree
- [x] #3 If it should stay excluded, document why in code (a one-line comment) so a future reader does not mistake the drop for a bug again
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Risolto 2026-09-02. Letto il codice reale (non solo la descrizione del task): IDENTIFYING_PROPERTY_KEYS/_IDENTIFYING_ANALYTICS_PROPERTY_KEYS non e' una allowlist ma un secondo filtro di ESCLUSIONE - room_code/public_id vengono attivamente rimossi dalle properties generiche (frontend: filtrati in sanitizeProperties; backend: in forbidden_keys, causerebbero 422 se presenti), non 'lasciati passare'. Decisione (AC#1): challenge_token resta escluso, stessa classe di privacy di room_code/public_id (token di invito condivisibile ma non enumerabile, CLAUDE.md 'Invite tokens... must be non-enumerable') - non promosso ad allowlist (AC#2 non applicabile, la scelta e' 'resta escluso'). Aggiunto un commento esplicito su entrambi i lati (analytics.js FORBIDDEN_PROPERTY_KEYS, backend_fastapi.py validate_properties forbidden_tokens) che documenta che l'esclusione di challenge_token e' voluta, non una collisione accidentale del filtro generico 'token' (AC#3). Nessun comportamento runtime cambiato - challenge_token era gia' escluso prima, ora lo e' per il motivo giusto e documentato.
<!-- SECTION:NOTES:END -->
