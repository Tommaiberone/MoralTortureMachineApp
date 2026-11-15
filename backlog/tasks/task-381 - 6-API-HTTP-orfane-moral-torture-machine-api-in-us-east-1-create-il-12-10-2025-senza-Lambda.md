---
id: TASK-381
title: >-
  6 API HTTP orfane 'moral-torture-machine-api' in us-east-1 (create il
  12/10/2025, senza Lambda)
status: Done
assignee: []
created_date: '2026-11-15 13:15'
updated_date: '2026-11-15 13:48'
labels:
  - infra
  - cost
  - debt
dependencies: []
priority: low
ordinal: 282000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovate il 15/11/2026 durante l'analisi dei costi (TASK-379/380): 7v3hxnovfb, 8h5gbdq4zf, bqm6tt1yld, dxvc0ebo1d, e0xrjty7pi, wzxd2l4n52, create tra le 14:20 e le 14:41 UTC del 12/10/2025, probabilmente da tentativi di deploy prima di passare a eu-west-1. Non hanno Lambda dietro e nessun client le usa, ma ogni richiesta che ricevono si paga; l'interruttore dei costi di account le copre già. Non sono nello stato Terraform attuale (prod è in eu-west-1).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Verificato che nessun client o stato Terraform le usi
- [x] #2 Cancellate con conferma dell'utente
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
15/11/2026, con l'autorizzazione dell'utente: nessun riferimento nel repo né negli stati Terraform del bucket moral-torture-machine-terraform-state, zero richieste dal 15/09, nessuna rotta né integrazione. Cancellate tutte e 6; in us-east-1 non resta nessuna API.
<!-- SECTION:FINAL_SUMMARY:END -->
