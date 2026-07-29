---
id: TASK-90
title: Verificare e rimuovere la tabella DynamoDB legacy non prefissata
status: Backlog
assignee: []
created_date: '2026-07-29 11:55'
labels:
  - technical-debt
  - aws
  - database
  - cost
dependencies: []
documentation:
  - backlog/docs/doc-1
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nell'account resta moral-torture-machine-dilemmas, tabella on-demand non prod con 34 record, separata dalla prod-moral-torture-machine-dilemmas usata dal deploy. Verificarne gli ultimi riferimenti e rimuoverla solo con conferma e percorso di recupero.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessun runtime o workflow di produzione usa la tabella legacy
- [ ] #2 Gli script locali hanno default sicuri e non la ricreano per errore
- [ ] #3 Un export o una conferma di non necessità precede la rimozione
- [ ] #4 La rimozione è verificata in AWS senza toccare la tabella prod
<!-- AC:END -->
