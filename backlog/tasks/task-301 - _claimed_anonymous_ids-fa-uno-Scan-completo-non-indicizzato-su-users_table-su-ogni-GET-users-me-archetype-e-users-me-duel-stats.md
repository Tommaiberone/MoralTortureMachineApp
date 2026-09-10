---
id: TASK-301
title: >-
  _claimed_anonymous_ids fa uno Scan completo non indicizzato su users_table su
  ogni GET /users/me/archetype e /users/me/duel-stats
status: Done
assignee: []
created_date: '2026-09-10 19:09'
updated_date: '2026-09-10 19:44'
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
- [x] #1 GET /users/me/archetype e GET /users/me/duel-stats non eseguono piu' uno Scan completo di users_table per servire una richiesta
- [x] #2 POST /challenges (fallback multi-device) non esegue piu' uno Scan completo di users_table
- [x] #3 Il comportamento funzionale (quali claim anonimi vengono trovati) resta identico, verificato con test esistenti/nuovi
- [x] #4 L'eventuale nuova GSI rispetta il vincolo AWS Free Tier di CLAUDE.md, verificato prima dell'implementazione
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta una GSI OwnerSubIndex (hash ownerSub) su users_table, indicizzando un attributo gia' scritto su ogni claim-lock (nessuna modifica al write path). _claimed_anonymous_ids ora usa _query_all invece di _scan_all: GET /users/me/archetype, GET /users/me/duel-stats e il fallback multi-device di POST /challenges non fanno piu' uno Scan completo di users_table. Capacita' fissa 1/1 sicura (a differenza di analytics_daily_aggregates): questa GSI e' shardata per account, non una singola chiave condivisa che cresce. Verificato Free Tier (stesso giorno della verifica ADR-139). 9 nuovi test dedicati (query non scan, paginazione) + 6 mock esistenti aggiornati da scan a query; tutti i 264 test del backend passano.
<!-- SECTION:FINAL_SUMMARY:END -->
