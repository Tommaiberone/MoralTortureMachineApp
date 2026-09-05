---
id: TASK-253
title: >-
  Tabelle DynamoDB users e moral_profiles senza deletion_protection, a
  differenza dello user pool Cognito
status: Done
assignee: []
created_date: '2026-09-04 15:02'
updated_date: '2026-09-05 21:49'
labels:
  - infra
  - data-safety
dependencies: []
priority: high
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente infra): aws_cognito_user_pool.users (main.tf:528-585) ha sia deletion_protection = ACTIVE sia lifecycle { prevent_destroy = true } (582-584). La tabella users (160-178) e moral_profiles (184-226) - che contengono la stessa classe di dati utente autoritativi e insostituibili - non hanno ne' deletion_protection_enabled = true (disponibile su aws_dynamodb_table da tempo nel provider AWS) ne' un blocco lifecycle prevent_destroy. Un refactor/rename di risorsa che Terraform risolve come delete-poi-create distruggerebbe una di queste tabelle senza alcun ostacolo, a differenza dello user pool.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 aws_dynamodb_table.users ha deletion_protection_enabled = true (o lifecycle prevent_destroy, coerente con la scelta gia' fatta per Cognito)
- [x] #2 aws_dynamodb_table.moral_profiles ha la stessa protezione
- [x] #3 terraform plan non mostra replace/destroy inatteso per nessuna delle due tabelle dopo la modifica
<!-- AC:END -->
