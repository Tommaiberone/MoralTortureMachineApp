---
id: TASK-323
title: 'Gamebook: aggiornamento sicuro dei testi di dilemmi esistenti in produzione'
status: To Do
assignee:
  - '@tommaso'
created_date: '2026-09-23 14:07'
labels:
  - gamebook
  - tecnico
milestone: m-0
dependencies: []
priority: high
ordinal: 224000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backend/scripts/populate_dynamodb_multilang.py in modalita' completa svuota la tabella (clear_dynamodb_table) e --append-only non modifica gli esistenti. Le correzioni di testo del libro devono arrivare in DynamoDB senza distruggere nulla.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Esiste un percorso che aggiorna solo i dilemmi modificati, senza cancellazioni
- [ ] #2 Verificato su un dilemma di prova
<!-- AC:END -->
