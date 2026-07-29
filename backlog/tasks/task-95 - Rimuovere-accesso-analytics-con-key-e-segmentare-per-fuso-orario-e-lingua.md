---
id: TASK-95
title: Rimuovere accesso analytics con key e segmentare per fuso orario e lingua
status: In Progress
assignee: []
created_date: '2026-07-29 13:32'
updated_date: '2026-07-29 13:40'
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
- [ ] #1 La dashboard non mostra, accetta o documenta una key admin; accesso solo con JWT Cognito admins
- [ ] #2 Il fingerprint analytics resta server-only e non è un meccanismo di accesso
- [ ] #3 Nuovi eventi registrano il fuso orario dichiarato dal dispositivo senza IP o geolocalizzazione
- [ ] #4 La dashboard mostra segmenti per fuso orario e lingua in-app, distinti da dati storici sconosciuti
- [ ] #5 Test backend, lint/build frontend passano e la release Android usa versione 1.3.1/code 8
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: implementato localmente accesso dashboard esclusivo via JWT Cognito admins, rinominato il segreto SSM come pepper interno senza rigenerarlo, aggiunti fuso orario dichiarato e lingua client anche agli eventi legacy. Dashboard mostra entrambi i segmenti; versione predisposta 1.3.1/code 8. Passano 18 test backend, py_compile, pnpm lint/build e terraform validate. Deploy e build APK 1.3.1 non eseguiti in attesa di richiesta esplicita.
<!-- SECTION:NOTES:END -->
