---
id: TASK-92
title: Formalizzare il bump obbligatorio della versione app
status: Done
assignee: []
created_date: '2026-07-29 11:59'
updated_date: '2026-07-29 11:59'
labels:
  - documentation
  - release
  - android
  - web
dependencies: []
documentation:
  - CLAUDE.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere a CLAUDE.md la regola che impone un bump coerente della versione ogni volta che un cambiamento richiede una nuova release dell'app, con versionCode Android monotono e tracciamento della versione nelle analytics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLAUDE.md definisce quando il bump è obbligatorio e quando non serve
- [x] #2 versionName Android e versione package restano coerenti
- [x] #3 Ogni nuovo APK incrementa versionCode rispetto a ogni build distribuita
- [x] #4 Il cambio versione è registrato nel task/release prima della build
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Aggiunta a CLAUDE.md la regola di bump obbligatorio con trigger ed eccezioni, SemVer, coerenza package.json/versionName, versionCode monotono per APK/AAB distribuiti e registrazione nel task con verifica app_version analytics. Versione corrente già coerente: 1.3.0, versionCode 7; nessun bump necessario per questa modifica documentale.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Formalizzata la policy di versionamento delle release web/Android senza modificare l'app o generare un APK.
<!-- SECTION:FINAL_SUMMARY:END -->
