---
id: TASK-25
title: Definire 12-16 archetipi bilingui
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-06 12:27'
labels:
  - m2-activation
  - content
  - archetypes
  - i18n
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Specificare nome, descrizione, forza, punto cieco, frase share e identità visuale per italiano e inglese.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni archetipo ha contenuti IT ed EN completi
- [x] #2 Gli archetipi coprono lo spazio delle sei dimensioni
- [x] #3 Copy e visual sono revisionati umanamente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Contenuto in backend/data/archetypes.json: 14 archetipi con nome, descrizione, forza, punto cieco e frase share IT+EN, piu identita visuale condivisa (emoji+colore). La revisione umana del 2026-08-06 ha portato il catalogo alla v2, con copy affinata e centroidi aggiornati per tragic_principled, blind_avenger e loyal_insider. Copertura delle sei dimensioni mantenuta, nessun duplicato e distanza minima tra centroidi 0.4243. La riclassificazione intenzionale dei profili e Duel v1 al catalogo v2 e documentata in TASK-25.1 / ADR-072.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Il proprietario ha revisionato e approvato copy e identita visuale dei 14 archetipi il 2026-08-06. La revisione aggiorna il catalogo a v2; la riclassificazione intenzionale dei profili e Duel v1 e documentata in TASK-25.1 e ADR-072.
<!-- SECTION:FINAL_SUMMARY:END -->
