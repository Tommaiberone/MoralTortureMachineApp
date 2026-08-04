---
id: TASK-137
title: >-
  [regression] Deploy in errore da 5 push per tag DynamoDB non valido su
  ops_error_alerts
status: Done
assignee: []
created_date: '2026-08-04 12:15'
updated_date: '2026-08-04 12:21'
labels:
  - regression
  - infra
  - deploy
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ogni deploy dal commit 'feat: persist ops error alerts to DynamoDB...' (2026-08-04T07:35) fallisce in Terraform Init & Apply: il tag Purpose della tabella ops_error_alerts conteneva una virgola ('...TTL, for offline triage'), non valida per i tag value DynamoDB - stesso identico problema gia' trovato e corretto due volte il 2026-08-02 per le tabelle party_rooms e Duel (ADR-055), ma non applicato a questa tabella nuova. Risultato: nessun deploy backend/frontend/Android e' andato a buon fine da 5 commit consecutivi (compreso il push di TASK-133/134/135/136/14 di oggi) - build Android, deploy frontend e Google Play publish sono stati saltati ogni volta perche' il job Deploy Backend falliva prima. L'ultimo deploy riuscito resta TASK-128 del 2026-08-03.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il tag Purpose di ops_error_alerts non contiene virgole/parentesi
- [x] #2 terraform validate passa
- [x] #3 Il prossimo push su main completa Deploy Backend, Android build e frontend deploy senza errori
<!-- AC:END -->
