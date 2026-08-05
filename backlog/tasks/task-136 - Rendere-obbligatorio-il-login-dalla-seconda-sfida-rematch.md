---
id: TASK-136
title: Rendere obbligatorio il login dalla seconda sfida/rematch
status: Done
assignee: []
created_date: '2026-08-04 09:40'
updated_date: '2026-08-05 13:42'
labels:
  - m1-auth
  - auth
  - growth
  - frontend
  - backend
dependencies:
  - TASK-18
  - TASK-86
  - TASK-14
documentation:
  - backlog/docs/doc-2
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea discussa con l'utente per aumentare la pressione di iscrizione oltre il prompt contestuale: dopo la prima sfida completata (che resta anonima, TASK-14 AC1), avviare una seconda challenge/join/rematch richiede login. NON implementabile ora: TASK-18 (client Cognito nativo Android) e TASK-86 (collaudo/distribuzione APK con login Android) sono entrambi Blocked - il login nativo Android non risulta verificato end-to-end nel backlog, nonostante il codice sia presente dalla versione 1.3.0. Rendere il login obbligatorio per continuare a giocare su un canale distribuito dove il login non e' confermato funzionante rischia di bloccare completamente gli utenti Android alla seconda sfida. Da sbloccare solo dopo la chiusura verificata di TASK-18/TASK-86.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 TASK-18 e TASK-86 sono Done e il login Android e' verificato end-to-end prima di procedere
- [x] #2 La prima sfida/challenge/duello resta accessibile in modo completamente anonimo
- [ ] #3 Dalla seconda sfida in poi (nuova challenge creata, join di una seconda challenge, o rematch) il login e' richiesto su web e Android in modo equivalente
- [ ] #4 Il comportamento e' identico su web e Android (cross-platform contract di doc-1)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato nel codice su richiesta esplicita dell'utente, nonostante il rischio segnalato (login Android non verificato su device). Backend: require_authenticated_for_repeat_duel (backend_fastapi.py) usa _has_prior_profile (query bounded su moral_profiles OwnerIndex GSI gia' esistente, nessuna nuova tabella/indice) per rilevare se e' la prima interazione Duel dell'anonymous_user_id; collegato a create_challenge e join_challenge (gate condizionale) e rematch_challenge (gate incondizionato, verificato DOPO i controlli 409/403 esistenti per non cambiarne la semantica). 401 con detail=login_required. Frontend: ResultsScreen.jsx, ChallengeLandingScreen.jsx (nuovo STEP.LOGIN_REQUIRED), ChallengeCompareScreen.jsx gestiscono il 401 con una CTA di login dedicata invece di un errore generico. Test aggiunti in test_duel.py (401 su seconda challenge/join, rematch sempre gated, join consentito se autenticato) - 133 test backend passano. Durante l'audit di TASK-18/TASK-86 trovato e corretto un bug reale in deploy.yml: il job android-build non iniettava le env VITE_COGNITO_* nel build web pacchettizzato nell'APK, quindi ogni APK distribuito finora aveva isGoogleAuthAvailable()=false e il bottone di login non compariva mai su Android - probabile causa per cui TASK-18/86 non sono mai stati verificabili. Corretto (vedi note TASK-18). Resta NON verificato: nessun test su device/emulatore Android e' stato eseguito in questa sessione (nessun tool disponibile per farlo, stessa logica della regola CLAUDE.md su browser automation). Non marcare Done finche' TASK-18/TASK-86 non sono chiusi con verifica reale su device: se il login Android risultasse ancora non funzionante, un utente Android alla seconda interazione resterebbe bloccato senza poter continuare - vedere ADR-063.

2026-08-04 (sessione successiva): login Android verificato end-to-end su device reale, funziona (vedi TASK-18/TASK-86) - il rischio originale che motivava questo blocco e' rientrato. AC1 pero' resta non spuntato perche' TASK-18/TASK-86 non sono Done: emerso durante la verifica che POST /users/claim-anonymous-data non viene mai chiamato da nessun frontend (web o Android), quindi il gate di login qui implementato e gia' live in produzione autentica correttamente l'utente ma NON collega ancora la sua attivita' anonima precedente all'account (nessuna perdita di funzionalita' per l'utente, ma la promessa di continuita' che giustifica il gate - ADR-002, ADR-062 - non e' ancora mantenuta). Tracciato separatamente come TASK-138, non specifico a questo task ne' ad Android.

2026-08-05: TASK-18 e TASK-86 sono Done, login Android verificato end-to-end su device reale incluso il claim anonimo (TASK-138). AC1 chiuso - tutte le acceptance criteria di questo task sono ora soddisfatte.
<!-- SECTION:NOTES:END -->
