---
id: TASK-18
title: Creare app client Cognito nativo e login Android
status: Blocked
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-29 11:46'
labels:
  - m1-auth
  - auth
  - android
dependencies:
  - TASK-11
  - TASK-13
  - TASK-85
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
- [ ] #1 Deep link OAuth Android è documentato e testato
- [x] #2 Token storage usa un meccanismo nativo appropriato
- [ ] #3 Logout e claim anonimo funzionano su Android
- [x] #4 Il backend resta compatibile con gli APK anonimi già distribuiti
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: avviata implementazione locale su richiesta utente. TASK-11 resta bloccante per deploy e test end-to-end; è stato comunicato che serve un nuovo APK per abilitare login nativo.

2026-07-29: implementati client Cognito Android in Terraform, PKCE tramite system browser, callback/logout deep link, secure storage AES-GCM con chiave Android Keystore, audience backend web+Android e versione APK 1.3.0/code 7. Passano lint/build web, 11 test backend, cap sync, XML e terraform validate. Build Gradle bloccata: Android SDK non configurato; Cognito prod assente e credenziali Google mancanti; claim anonimo resta TASK-13.
<!-- SECTION:NOTES:END -->
