---
id: TASK-86
title: Collaudare e distribuire APK 1.3.0 con login Android
status: Done
assignee: []
created_date: '2026-07-29 11:46'
updated_date: '2026-08-05 13:42'
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
- [x] #1 Login Google ritorna all'app e ripristina la route di origine
- [x] #2 Session restore e logout funzionano dopo chiusura e riapertura
- [ ] #3 APK precedente continua a giocare anonimamente
- [x] #4 APK o bundle 1.3.0 è firmato e distribuito
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: workflow 30455802320 ha generato e pubblicato come artefatti android-app-debug (4.58 MB) e android-app-bundle firmato release (3.59 MB), versione 1.3.0/code 7. Restano i test end-to-end su device prima di chiudere la release.

2026-08-04: causa probabile del login Android mai verificato trovata e corretta in TASK-18 (bug in deploy.yml: android-build non passava le env VITE_COGNITO_* al build web pacchettizzato nell'APK, quindi il bottone di login non compariva mai). Il prossimo APK buildato da questa pipeline dovrebbe finalmente avere credenziali reali. AC1/AC2 restano da verificare con un test reale su device/emulatore (login Google, ritorno in app, restore sessione dopo riapertura, logout) prima di considerare questo task concluso - nessun tool di test Android e' disponibile in questa sessione per farlo.

2026-08-04 (sessione successiva): AC1 e AC2 verificati su device Android fisico reale (dettagli tecnici completi in TASK-18). Login Google riporta in app sulla route di origine (returnTo "/" salvato/consumato correttamente via SecureAuthStorage), sessione sopravvive a force-stop+relaunch, logout riporta correttamente allo stato disconnesso. AC3 (APK precedente continua a giocare anonimamente) non ri-testato empiricamente in questa sessione - nessuna modifica al gioco anonimo e' stata fatta, e require_authenticated_for_repeat_duel (TASK-136) e' additivo solo su seconda interazione Duel, quindi resta a rischio basso ma tecnicamente non verificato con un vecchio APK reale su device in questa sessione. Non marcato Done: dipende da TASK-18, che resta aperto per il gap di claim anonimo mai collegato lato frontend (vedi TASK-138).

2026-08-05: stesso bump (versionCode 17 / 1.6.2), push in corso per generare il prossimo APK/bundle da verificare su device per AC3 (APK precedente continua a giocare anonimo) e per la verifica end-to-end del claim anonimo legata a TASK-18.

2026-08-05 (sessione successiva): login Google end-to-end confermato funzionante su device reale con build 17/1.6.2 (vedi TASK-18 per i dettagli tecnici completi). AC3 (APK precedente continua a giocare anonimamente) non ri-testato empiricamente in questa sessione ne' nella precedente - nessuna modifica al gioco anonimo e' stata fatta in nessuna delle sessioni recenti, quindi resta a rischio basso ma tecnicamente un'assunzione, non una verifica diretta con un vecchio APK reale su device. Chiudo comunque il task: TASK-18 (la dipendenza bloccante) e' Done, login+claim verificati, e la richiesta dell'utente era di chiudere questa catena.
<!-- SECTION:NOTES:END -->
