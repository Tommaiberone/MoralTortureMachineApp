---
id: TASK-95
title: Rimuovere accesso analytics con key e segmentare per fuso orario e lingua
status: Done
assignee: []
created_date: '2026-07-29 13:32'
updated_date: '2026-07-29 13:47'
labels:
  - auth
  - analytics
  - backend
  - frontend
  - android
dependencies:
  - TASK-3
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eliminare il fallback di autenticazione analytics basato su key, autorizzando esclusivamente ID token Cognito con gruppo admins. Estendere le analytics privacy-safe con fuso orario dichiarato dal dispositivo e lingua in-app, mostrando entrambi i segmenti nella dashboard per web e Android.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La dashboard non mostra, accetta o documenta una key admin; accesso solo con JWT Cognito admins
- [x] #2 Il fingerprint analytics resta server-only e non è un meccanismo di accesso
- [x] #3 Nuovi eventi registrano il fuso orario dichiarato dal dispositivo senza IP o geolocalizzazione
- [x] #4 La dashboard mostra segmenti per fuso orario e lingua in-app, distinti da dati storici sconosciuti
- [x] #5 Test backend, lint/build frontend passano e la release Android usa versione 1.3.1/code 8
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: implementato localmente accesso dashboard esclusivo via JWT Cognito admins, rinominato il segreto SSM come pepper interno senza rigenerarlo, aggiunti fuso orario dichiarato e lingua client anche agli eventi legacy. Dashboard mostra entrambi i segmenti; versione predisposta 1.3.1/code 8. Passano 18 test backend, py_compile, pnpm lint/build e terraform validate. Deploy e build APK 1.3.1 non eseguiti in attesa di richiesta esplicita.

2026-07-29 deploy completato nel run GitHub Actions 30457158547. Homepage, dashboard e health rispondono 200; overview analytics risponde 401 sia senza token sia con X-Admin-Key, quindi la key non autorizza più. Lambda usa solo ANALYTICS_FINGERPRINT_SECRET_SSM_NAME e lo state Terraform ha il pepper rinominato. Artefatti 1.3.1/code 8: APK debug 4.58 MB e AAB release 3.59 MB.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Analytics ora richiede esclusivamente Cognito admins e segmenta lingua app/fuso orario privacy-safe; release web e Android 1.3.1/code 8 pubblicata.
<!-- SECTION:FINAL_SUMMARY:END -->
