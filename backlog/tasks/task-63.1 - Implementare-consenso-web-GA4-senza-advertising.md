---
id: TASK-63.1
title: Implementare consenso web GA4 senza advertising
status: Done
assignee: []
created_date: '2026-07-31 08:02'
updated_date: '2026-07-31 08:06'
labels:
  - privacy
  - analytics
  - web
dependencies: []
parent_task_id: TASK-63
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Banner web bilingue per Google Analytics opzionale: nessun tag prima del consenso, advertising sempre negato, scelta revocabile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GA4 non viene caricato prima del consenso.
- [x] #2 Banner IT/EN consente accettazione, rifiuto e revoca.
- [x] #3 Policy web dichiara titolare e retention GA4 a due mesi.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementato consenso web GA4 bilingue: il tag viene inserito solo dopo opt-in, senza advertising; policy e revoca sono disponibili. Verificati lint e build prod con l’ID GA4 iniettato.
<!-- SECTION:FINAL_SUMMARY:END -->
