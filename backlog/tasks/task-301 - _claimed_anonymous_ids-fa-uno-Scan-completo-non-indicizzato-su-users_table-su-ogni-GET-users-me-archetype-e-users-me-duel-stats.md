---
id: TASK-301
title: >-
  _claimed_anonymous_ids fa uno Scan completo non indicizzato su users_table su
  ogni GET /users/me/archetype e /users/me/duel-stats
status: To Do
assignee: []
created_date: '2026-09-10 19:09'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 202000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante un audit esplicito richiesto dall'utente dopo aver risolto lo stesso identico pattern per /admin/analytics/overview (TASK-300, ADR-137/142).

backend_fastapi.py: _claimed_anonymous_ids (riga ~1841) chiama _scan_all (riga ~1826) su users_table con una FilterExpression su ownerSub - questo e' uno Scan completo (paginato, tutte le pagine lette) filtrato lato client, non una Query indicizzata. E' chiamato da:
- GET /users/me/archetype (riga ~2043) - pagina 'il mio ultimo archetipo', probabilmente visitata di routine da ogni utente autenticato che torna sull'app
- GET /users/me/duel-stats (riga ~2170) - pagina statistiche Duel personali, stessa frequenza d'uso attesa
- POST /challenges (riga ~2769) - fallback multi-device nella creazione di una sfida

A differenza di /admin/analytics/overview (endpoint admin-only, raramente visitato), questi sono endpoint utente-facing su pagine che un utente autenticato normale visita di routine. users_table cresce con ogni registrazione e non ha TTL sui record utente reali (solo sui claim-lock 'anon#'), quindi il costo di questo Scan cresce nel tempo esattamente come accadeva per /admin/analytics/overview prima del fix.

Direzione di fix suggerita (da validare): aggiungere una GSI su users_table con hash_key=ownerSub (o riusare/estendere un pattern gia' esistente) per permettere una Query mirata invece dello Scan - users_table e' gia' PAY_PER_REQUEST quindi una nuova GSI non richiede pianificazione di capacity, solo il costo aggiuntivo per storage/scrittura dell'indice (verificare Free Tier prima di implementare, come da CLAUDE.md).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /users/me/archetype e GET /users/me/duel-stats non eseguono piu' uno Scan completo di users_table per servire una richiesta
- [ ] #2 POST /challenges (fallback multi-device) non esegue piu' uno Scan completo di users_table
- [ ] #3 Il comportamento funzionale (quali claim anonimi vengono trovati) resta identico, verificato con test esistenti/nuovi
- [ ] #4 L'eventuale nuova GSI rispetta il vincolo AWS Free Tier di CLAUDE.md, verificato prima dell'implementazione
<!-- AC:END -->
