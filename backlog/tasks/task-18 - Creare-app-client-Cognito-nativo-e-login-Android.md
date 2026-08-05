---
id: TASK-18
title: Creare app client Cognito nativo e login Android
status: In Progress
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-05 08:21'
labels:
  - m1-auth
  - auth
  - android
dependencies:
  - TASK-11
  - TASK-13
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere il client nativo PKCE e il flusso Capacitor mantenendo parità con il web. Prima dell'implementazione valutare e comunicare il rebuild APK richiesto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deep link OAuth Android è documentato e testato
- [x] #2 Token storage usa un meccanismo nativo appropriato
- [ ] #3 Logout e claim anonimo funzionano su Android
- [x] #4 Il backend resta compatibile con gli APK anonimi già distribuiti
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: avviata implementazione locale su richiesta utente. TASK-11 resta bloccante per deploy e test end-to-end; è stato comunicato che serve un nuovo APK per abilitare login nativo.

2026-07-29: implementati client Cognito Android in Terraform, PKCE tramite system browser, callback/logout deep link, secure storage AES-GCM con chiave Android Keystore, audience backend web+Android e versione APK 1.3.0/code 7. Passano lint/build web, 11 test backend, cap sync, XML e terraform validate. Build Gradle bloccata: Android SDK non configurato; Cognito prod assente e credenziali Google mancanti; claim anonimo resta TASK-13.

2026-08-04: durante lavoro su TASK-136 (login obbligatorio dalla seconda sfida) trovato un bug reale in .github/workflows/deploy.yml - il job android-build costruiva il bundle web (poi impacchettato via 'npx cap sync android') passando solo VITE_API_URL, mai VITE_COGNITO_DOMAIN/VITE_COGNITO_CLIENT_ID/VITE_COGNITO_NATIVE_CLIENT_ID (che frontend-deploy invece imposta correttamente). Risultato: isGoogleAuthAvailable() era sempre false su ogni APK distribuito finora, quindi AuthButton non veniva mai renderizzato su Android, indipendentemente dalla correttezza del codice nativo PKCE/Keystore sottostante. Corretto aggiungendo le tre env anche allo step 'Build web app' di android-build. Questo NON e' ancora una verifica end-to-end su device: resta da fare un test reale (login Google -> ritorno app -> sessione restaurata -> logout) sul prossimo APK buildato con questo fix, prima di poter chiudere AC1/AC3 e TASK-86.

2026-08-04 (sessione successiva): verificato end-to-end su device Android fisico reale (Xiaomi POCO, Android 16, collegato via adb - adb/backlog CLI installati in sessione senza privilegi admin, vedi note operative). L'app installata da Play Store risultava ferma a versionCode 14/1.5.0 (build precedente al fix qui sopra: Play aveva propagato la 16/1.6.1 da meno di un'ora). Confermato via `gh run view` che la run 30911640401 (push del fix) e' completata con successo su tutti i job inclusa 'Publish to Google Play (production)'. Scaricato l'artifact android-app-debug di quella run, verificato che il bundle JS contiene davvero il client id Cognito Android, disinstallata la 14 e side-caricata via adb (richiesto anche attivare 'Installa tramite USB' nelle Opzioni sviluppatore MIUI, non solo Debug USB - bloccava l'install in modo silenzioso senza popup visibile). Log catturati con adb logcat durante un login reale (utente ha toccato il bottone fisicamente): PKCE state/verifier salvati via SecureAuthStoragePlugin, Custom Tab aperta su Cognito hosted UI, redirect Google, callback ricevuto su moraltorturemachine://auth/callback con code+state validi, scambio token su /oauth2/token riuscito (368ms), sessione persistita - nessun errore in nessun punto della catena. Confermato anche via screenshot: force-stop + relaunch mantiene la sessione (Tommaso Bersani/SIGN OUT visibili), tap su SIGN OUT torna correttamente a SIGN IN WITH GOOGLE. AC1 chiuso (deep link testato, gia' documentato in AUTHENTICATION_GUIDE.md). Logout di AC3 verificato funzionante. La meta' "claim anonimo" di AC3 pero' NON e' verificabile perche' non esiste: grep su tutto frontend/src conferma che nessun punto del codice (ne' web ne' Android, non solo Android) chiama mai POST /users/claim-anonymous-data - claim_anonymous_user_id() in backend_fastapi.py e' raggiungibile solo da quell'endpoint, mai invocato lato client. TASK-13 (Done dal 2026-07-31) copriva solo il comportamento backend (idempotenza/conflitti), non includeva mai come AC il collegamento frontend. Aperto TASK-138 per questo gap, non specifico ad Android. AC3 lasciato non spuntato e status portato a 'To Do' (non piu' 'Blocked' - il blocco era la mancanza di un device, ora risolto) finche' TASK-138 non e' chiuso.

2026-08-04 (stesso giorno, su richiesta utente): TASK-138 implementato e chiuso (claimAnonymousData collegata in authClient.js). AC3 di questo task pero' resta non spuntato: il codice esiste, passa lint/build, ma non e' stato verificato con un vero login su device (il redirect_uri di un build locale servito al telefono non e' nella allowlist del client Cognito web/Android) - vedi note TASK-138. Riverificare la chiamata (deve comparire nei log/rete durante un login reale) sul prossimo APK distribuito prima di spuntare definitivamente AC3 e chiudere questo task.

2026-08-05: bump versionCode 16->17 / versionName 1.6.1->1.6.2 (frontend/package.json, frontend/android/app/build.gradle) per portare in un nuovo APK distribuito il wiring claim-anonymous-data di TASK-138 (c7c3f2b), che era stato mergiato dopo il bump precedente (3dc5704) e quindi non era mai stato incluso in un build distribuito. Device Xiaomi POCO ricollegato via adb per la verifica su questo nuovo build.
<!-- SECTION:NOTES:END -->
