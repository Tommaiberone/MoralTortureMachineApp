---
id: TASK-25.1
title: Decidere stabilita archetipi v1
status: Done
assignee: []
created_date: '2026-08-06 10:21'
updated_date: '2026-08-06 12:27'
labels:
  - m2-activation
  - archetypes
  - data-compatibility
dependencies: []
parent_task_id: TASK-25
priority: high
type: task
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il catalogo archetipi passa da v1 a v2 con centroidi modificati. I profili salvano archetypeId e archetypesVersion, ma GET profilo e Duel ricalcolano oggi dal solo catalogo corrente: risultati v1 possono quindi cambiare al prossimo accesso. Serve una scelta esplicita prima del deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scelta owner: preservare gli esiti v1 oppure accettare la riclassificazione a v2.
- [x] #2 ADR registra il comportamento dei profili e Duel esistenti.
- [x] #3 Riclassificazione v1 verso v2 verificata e documentata; nessun catalogo storico introdotto.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Il 2026-08-06 il proprietario ha scelto esplicitamente la riclassificazione dei profili e Duel v1 al catalogo archetipi v2. ADR-072 e doc-1 documentano il comportamento; nessun catalogo storico o migrazione dati viene introdotto.
<!-- SECTION:FINAL_SUMMARY:END -->
