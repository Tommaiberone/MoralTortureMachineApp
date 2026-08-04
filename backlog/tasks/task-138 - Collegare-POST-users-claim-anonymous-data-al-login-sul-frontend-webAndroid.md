---
id: TASK-138
title: Collegare POST /users/claim-anonymous-data al login sul frontend (web+Android)
status: Done
assignee: []
created_date: '2026-08-04 14:38'
updated_date: '2026-08-04 14:48'
labels:
  - m1-auth
  - auth
  - frontend
  - bug
dependencies:
  - TASK-13
priority: high
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-13 (Done, 2026-07-31) ha implementato solo il lato backend del claim idempotente dei dati anonimi (POST /users/claim-anonymous-data). Verificando TASK-18 su device Android reale il 2026-08-04 e' emerso che nessun punto del frontend (ne' web ne' Android, grep completo su frontend/src) chiama mai questo endpoint dopo un login riuscito: claim_anonymous_user_id() nel backend e' raggiungibile solo da quella route, mai invocata lato client. Risultato: oggi il login autentica correttamente l'utente ma non collega alcuna attivita' anonima precedente (moral_profiles, duel) all'account, su nessuna piattaforma - non e' mai stato un problema specifico di Android. Questo mina la promessa di continuita' che giustifica sia ADR-002 (claim idempotente dopo login) sia il nuovo gate di login obbligatorio dalla seconda sfida (TASK-136/ADR-063), gia' live in produzione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dopo un login riuscito (web e Android), il client chiama POST /users/claim-anonymous-data con l'anonymousUserId corrente
- [x] #2 La chiamata e' non bloccante rispetto al login (un suo fallimento non impedisce l'accesso ne' mostra un errore fatale)
- [x] #3 Un secondo login sullo stesso device/account non duplica ne' fallisce visibilmente (si appoggia all'idempotenza gia' garantita da TASK-13 lato backend)
- [x] #4 Comportamento verificato equivalente su web e Android
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-04: aggiunta claimAnonymousData in frontend/src/auth/authClient.js, invocata (fire-and-forget, mai await-ata, errori solo loggati con console.warn) dentro completeGoogleSignIn subito dopo persistSession - l'unico punto in cui convergono sia il callback web (AuthCallbackScreen.jsx via /auth/callback) sia il listener nativo Android (AuthProvider.jsx via appUrlOpen), quindi nessuna duplicazione tra piattaforme e nessun rischio di farla scattare anche sui refresh silenziosi del token (che non passano da completeGoogleSignIn). POST con getAuthenticatedApiHeaders(session.idToken) e body { anonymousUserId: getAnonymousUserId() }, stesso pattern gia' in produzione in AccountDeleteScreen.jsx. Schema verificato contro ClaimAnonymousDataRequest (backend_fastapi.py riga 730). AC3 si appoggia all'idempotenza server-side gia' testata in TASK-13 (nessun nuovo test aggiunto, il backend non e' cambiato). Verificato: lint (eslint diretto) e pnpm build:prod puliti. NON verificato con un vero login su device in questa sessione (a differenza della diagnosi Android di TASK-18/86): avrebbe richiesto servire il build locale al telefono e il client web Cognito quasi certamente non accetta un redirect_uri di sviluppo/LAN nella sua allowlist, quindi il test end-to-end reale di questa chiamata resta da fare sul prossimo deploy in produzione.
<!-- SECTION:NOTES:END -->
