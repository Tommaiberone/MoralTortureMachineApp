---
id: TASK-96
title: Pubblicare automaticamente l'AAB su Google Play in pipeline
status: In Progress
assignee: []
created_date: '2026-07-29 13:41'
updated_date: '2026-07-29 13:43'
labels:
  - android
  - release
  - ci-cd
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il job android-build di deploy.yml (o aggiungerne uno nuovo dopo bundleRelease) per caricare l'AAB firmato sul Play Console tramite Google Play Developer API, usando un service account dedicato. Target iniziale: track 'internal' per evitare push automatici in produzione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nuovo job GitHub Actions pubblica l'AAB firmato sul track internal di Play Console usando la Play Developer API
- [ ] #2 Autenticazione tramite service account JSON salvato come GitHub secret, mai loggato o committato
- [ ] #3 Il job gira solo su push a main con esito positivo del build Android esistente, senza introdurre un secondo stack o servizio AWS
- [ ] #4 Documentazione (doc-1/ADR) aggiornata con la nuova dipendenza esterna (Play Developer API) e i passaggi manuali richiesti all'utente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato il job play-store-publish in deploy.yml (needs android-build), gated dietro workflow_dispatch con input publish_to_play_store/play_store_track (default internal), usa r0adkll/upload-google-play con secret PLAY_STORE_SERVICE_ACCOUNT_JSON. Aggiunta sezione 'Release automation' a doc-1 e ADR-014/ADR-015 a decision-1. Restano da completare i passaggi manuali lato utente (service account Play Console, secret GitHub) e un dispatch di verifica prima di chiudere la task.
<!-- SECTION:NOTES:END -->
