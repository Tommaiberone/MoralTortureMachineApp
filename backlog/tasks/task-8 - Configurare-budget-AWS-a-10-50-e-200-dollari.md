---
id: TASK-8
title: 'Configurare budget AWS a 10, 50 e 200 dollari'
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m0-foundation
  - infra
  - cost
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere via Terraform budget e notifiche progressive prima di introdurre servizi a costo variabile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Le tre soglie mensili sono gestite da Terraform
- [ ] #2 Ogni allarme ha destinatario e runbook documentati
- [ ] #3 Terraform validate e plan non introducono stack dev
<!-- AC:END -->
