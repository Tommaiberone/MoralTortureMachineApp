---
id: TASK-86
title: Collaudare e distribuire APK 1.3.0 con login Android
status: Blocked
assignee: []
created_date: '2026-07-29 11:46'
updated_date: '2026-08-04 10:57'
labels:
  - m1-auth
  - android
  - release
  - qa
dependencies:
  - TASK-18
documentation:
  - AUTHENTICATION_GUIDE.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Completare il login end-to-end su device, verificare la compatibilità anonima degli APK precedenti e produrre/distribuire l'APK versionCode 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Login Google ritorna all'app e ripristina la route di origine
- [ ] #2 Session restore e logout funzionano dopo chiusura e riapertura
- [ ] #3 APK precedente continua a giocare anonimamente
- [x] #4 APK o bundle 1.3.0 è firmato e distribuito
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: workflow 30455802320 ha generato e pubblicato come artefatti android-app-debug (4.58 MB) e android-app-bundle firmato release (3.59 MB), versione 1.3.0/code 7. Restano i test end-to-end su device prima di chiudere la release.

2026-08-04: causa probabile del login Android mai verificato trovata e corretta in TASK-18 (bug in deploy.yml: android-build non passava le env VITE_COGNITO_* al build web pacchettizzato nell'APK, quindi il bottone di login non compariva mai). Il prossimo APK buildato da questa pipeline dovrebbe finalmente avere credenziali reali. AC1/AC2 restano da verificare con un test reale su device/emulatore (login Google, ritorno in app, restore sessione dopo riapertura, logout) prima di considerare questo task concluso - nessun tool di test Android e' disponibile in questa sessione per farlo.
<!-- SECTION:NOTES:END -->
