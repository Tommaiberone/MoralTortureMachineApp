---
id: TASK-26
title: Implementare motore archetipi deterministico e versionato
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 10:12'
labels:
  - m2-activation
  - backend
  - archetypes
  - testing
dependencies:
  - TASK-25
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Assegnare archetipi dalle sei dimensioni con algoritmo riproducibile e fixture sui confini.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Stessi input e versione producono sempre lo stesso archetipo
- [x] #2 Fixture coprono tutti gli archetipi e i boundary
- [x] #3 La versione algoritmo è salvata nel risultato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Motore nearest-centroid puro (backend/src/archetype_engine.py) su 14 centroidi (backend/data/archetypes.json v1). Distanza euclidea, tie-break su id alfabetico. Versione salvata in archetypesVersion nella risposta di /analyze-results. Fixture di test: tutti e 14 gli archetipi recuperati esattamente al proprio centroide + caso di boundary genuino (equidistanza verificata) tra ruthless_pragmatist e noble_liar in backend/tests/test_archetype_engine.py (9 test, tutti verdi).
<!-- SECTION:NOTES:END -->
