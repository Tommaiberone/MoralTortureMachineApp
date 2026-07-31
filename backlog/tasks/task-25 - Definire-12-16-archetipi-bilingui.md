---
id: TASK-25
title: Definire 12-16 archetipi bilingui
status: In Progress
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 10:13'
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
- [ ] #3 Copy e visual sono revisionati umanamente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Contenuto creato in backend/data/archetypes.json: 14 archetipi con nome/descrizione/forza/punto cieco/frase share IT+EN, identita visuale (emoji+colore) condivisa. Coprono lo spazio delle sei dimensioni (Empathy, Integrity, Responsibility, Justice, Altruism, Honesty) con esempi alti e bassi per ciascuna (verificato via script: distanza minima tra centroidi 0.3, nessun duplicato). AC3 non spuntata: la copy e' stata scritta da me (AI) e richiede revisione umana esplicita prima di considerare il task Done, come previsto dall'AC stessa.
<!-- SECTION:NOTES:END -->
