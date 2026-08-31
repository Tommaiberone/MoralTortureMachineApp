---
id: TASK-212
title: >-
  [regression] create_challenge's profilePublicId ownership check likely still
  404s for genuine cross-device profiles
status: Done
assignee: []
created_date: '2026-08-31 10:17'
updated_date: '2026-08-31 11:07'
labels:
  - backend
  - duel
  - regression
dependencies: []
priority: high
type: bug
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante l'audit generale post-TASK-206 delle feature mergeate tra il 10 e il 31 agosto (mai davvero verificate in produzione). Il commit dc0de9d (TASK-193, 10/8) doveva risolvere un 400 su 'Sfida qualcuno di nuovo' per account multi-dispositivo: GET /users/me/archetype ora restituisce profilePublicId risolto su TUTTE le identita' anonime rivendicate (_claimed_anonymous_ids su claims['sub'], non solo il dispositivo corrente), e il frontend (AccountDeleteScreen.jsx) lo passa esplicitamente a POST /challenges. Il problema: create_challenge (backend_fastapi.py ~riga 2550) quando riceve profilePublicId fa 'profile = get_profile_or_404(...)' poi verifica 'if profile.get("ownerAnonymousUserId") != anonymous_user_id: raise 404' - dove anonymous_user_id e' SOLO l'header X-Anonymous-User-Id del dispositivo corrente (require_anonymous_user_id(request)), non risolto attraverso _claimed_anonymous_ids come fa invece get_my_latest_archetype. Se l'ultimo profilo dell'utente e' stato creato su un dispositivo diverso da quello con cui sta ora sfidando qualcuno (esattamente lo scenario multi-dispositivo che il fix doveva risolvere), ownerAnonymousUserId sara' l'id del vecchio dispositivo e la condizione fallisce -> 404 'Profile not found'. Il sintomo e' cambiato da 400 a 404 ma il caso d'uso originale (sfidare qualcuno con il profilo piu' recente rivendicato su un altro dispositivo) sembra ancora rotto. Non verificato con un vero test multi-dispositivo/multi-account (richiederebbe due sessioni autenticate reali); trovato solo tramite lettura del codice.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un utente autenticato il cui profilo piu' recente e' stato creato su un dispositivo diverso da quello corrente puo' creare una sfida passando quel profilePublicId senza ricevere 404
- [x] #2 Il controllo di ownership per profilePublicId usa la stessa risoluzione multi-dispositivo (_claimed_anonymous_ids) gia' usata da get_my_latest_archetype, non il solo anonymous_user_id del dispositivo corrente
- [x] #3 Un profilePublicId che non appartiene per nulla all'account autenticato (ne' al dispositivo corrente ne' a nessun altro dispositivo rivendicato) continua a essere rifiutato con 404 - il controllo diventa piu' corretto, non piu' permissivo
- [x] #4 Test backend aggiunto che copre esplicitamente il caso cross-device (profilo con ownerAnonymousUserId di un dispositivo A, richiesta autenticata dal dispositivo B, stesso account)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Confermato e corretto. create_challenge ora, quando profilePublicId e' specificato e il controllo diretto owner==anonymous_user_id fallisce, verifica se il chiamante e' autenticato (get_optional_user) e in tal caso risolve l'ownership su TUTTE le identita' rivendicate dall'account (_claimed_anonymous_ids(claims['sub'])) - la stessa mappa autoritativa gia' usata da get_my_latest_archetype per produrre quello stesso profilePublicId. Un chiamante anonimo (nessun bearer token) continua a usare solo il confronto diretto sul dispositivo corrente, quindi non si allarga la superficie per utenti non autenticati. Aggiunti 2 test in test_duel.py: test_cross_device_profile_allowed_when_authenticated_and_claimed (profilo del dispositivo A, richiesta autenticata dal dispositivo B, stesso account -> sfida creata con successo) e test_404_when_authenticated_but_profile_not_claimed_by_this_account (essere autenticati non e' sufficiente da solo, il profilo deve comparire davvero in _claimed_anonymous_ids, altrimenti resta 404 - garantisce che il controllo sia diventato piu' corretto, non piu' permissivo). 186 test backend verdi (184 + 2 nuovi), py_compile pulito.

Deploy confermato: run 33385072640, tutti i job verdi (Publish to Google Play correttamente skippato, nessun bump di versione richiesto per un fix backend-only).
<!-- SECTION:FINAL_SUMMARY:END -->
