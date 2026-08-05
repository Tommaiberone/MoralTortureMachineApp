---
id: TASK-164
title: Doppio tap su Sign in with Google causa Invalid authentication callback
status: Done
assignee: []
created_date: '2026-08-05 13:36'
updated_date: '2026-08-05 13:37'
labels:
  - bug
  - frontend
  - android
  - auth
dependencies: []
priority: high
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Riprodotto su device reale durante la verifica TASK-18/86/136 (2026-08-05): log logcat mostrano due invocazioni di beginGoogleSignIn() a ~300ms di distanza (probabile doppio tap - AuthButton.jsx aveva disabled={loading} ma 'loading' riflette solo il restore della sessione iniziale, non e' mai true durante il click di login stesso). Ogni invocazione genera un nuovo state/PKCE verifier e li scrive sulle stesse chiavi di storage (mtm_oauth_state, mtm_pkce_verifier), sovrascrivendo quelli della invocazione precedente; entrambe aprono anche un browser tab. Quando torna il callback della prima richiesta, lo storage contiene ormai lo state della seconda: completeGoogleSignIn (authClient.js) rifiuta correttamente il mismatch con 'Invalid authentication callback', bloccando un login altrimenti valido. Bug preesistente, non introdotto da nessuna modifica di questa sessione - mai emerso prima perche' nessun login reale era arrivato a buon fine su un device fino a oggi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un secondo tap su un bottone di login mentre il primo sign-in e' gia' in corso non avvia una seconda richiesta OAuth (beginGoogleSignIn e' un no-op se gia' in flight)
- [x] #2 Nessuna regressione nel comportamento di login a singolo tap (verificato via lint/build; verifica end-to-end su device demandata all'utente, nessun browser automation tool disponibile)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: fix implementato in authClient.js - flag module-level googleSignInInFlight, impostato all'ingresso di beginGoogleSignIn e resettato in un blocco finally; una seconda chiamata mentre la prima e' in corso ritorna immediatamente senza toccare storage ne' aprire un secondo browser tab. Protegge tutti e 3 i chiamanti (AuthButton, ChallengeLandingScreen step LOGIN_REQUIRED, AccountDeleteScreen not-authenticated view) perche' tutti passano da questa stessa funzione. Lint+build puliti. Nota per l'utente: e' un fix a codice web pacchettizzato nell'app Android (authClient.js gestisce anche il flusso nativo) - serve un bump di versione + nuova build Android prima che questo fix raggiunga un dispositivo reale, per ora il login sull'APK gia' installato (17/1.6.2) funziona comunque con un singolo tap pulito, il bug scatta solo con doppia invocazione ravvicinata.
<!-- SECTION:NOTES:END -->
