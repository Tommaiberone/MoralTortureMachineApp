---
id: TASK-96
title: Pubblicare automaticamente l'AAB su Google Play in pipeline
status: In Progress
assignee: []
created_date: '2026-07-29 13:41'
updated_date: '2026-07-29 14:12'
labels:
  - android
  - release
  - ci-cd
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il job android-build di deploy.yml con un job play-store-publish che carica l'AAB firmato su Play Console tramite Google Play Developer API, usando un service account dedicato. Su richiesta esplicita dell'utente (dopo aver segnalato il rischio) pubblica in automatico sul track production ad ogni push su main che alza versionCode, senza gate umano intermedio; il dispatch manuale resta disponibile per test su altri track. Vedi ADR-017.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Autenticazione tramite service account JSON salvato come GitHub secret, mai loggato o committato
- [x] #2 Documentazione (doc-1/ADR) aggiornata con la nuova dipendenza esterna (Play Developer API) e i passaggi manuali richiesti all'utente
- [x] #3 Il job play-store-publish pubblica automaticamente sul track production quando un push su main alza versionCode in frontend/android/app/build.gradle; un push che non tocca versionCode builda Android ma non pubblica
- [x] #4 Il dispatch manuale (workflow_dispatch + publish_to_play_store) resta disponibile per pubblicare ad-hoc su un track scelto (internal/alpha/beta/production) senza bump di versione, per test
- [x] #5 Nessun nuovo servizio o stack AWS introdotto; il job dipende solo dall'artifact AAB gia' prodotto da android-build
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Test end-to-end riuscito: run workflow_dispatch su branch ci/play-store-publish (run 30458451825, https://github.com/Tommaiberone/MoralTortureMachineApp/actions/runs/30458451825) con publish_to_play_store=true e track internal. Tutti i job verdi, incluso 'Publish to Google Play (internal)' in 25s: AAB firmato 1.3.1/code 8 caricato su Play Console track internal via service account. Modifiche non ancora mergiate su main, in attesa di conferma utente.
<!-- SECTION:NOTES:END -->
