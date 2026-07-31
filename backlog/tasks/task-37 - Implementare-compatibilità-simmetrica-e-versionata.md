---
id: TASK-37
title: Implementare compatibilità simmetrica e versionata
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:16'
labels:
  - m4-duel
  - backend
  - scoring
  - testing
dependencies:
  - TASK-26
  - TASK-34
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Separare accordo risposta, distanza dimensionale e copy narrativa usando template deterministici.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 compatibility(A,B) equivale a compatibility(B,A)
- [x] #2 Test coprono boundary e regressioni
- [x] #3 Versione formula è salvata nel confronto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
backend/src/compatibility_engine.py: compute_compatibility(averages_a, averages_b) puramente basato su distanza |a-b| per dimensione, nessuna dipendenza da AI/ordine di chiamata. Simmetria verificata da test dedicato (stesso overallAgreementPct, mostDivergent/mostAlignedDimension e distanze identiche scambiando A e B). Boundary coperti: profili identici (100%), massimamente opposti (0%), dimensione mancante (fallback neutro 0.55 senza crash), tie-break deterministico alfabetico su dimensioni a pari distanza. COMPATIBILITY_VERSION=1 incluso in ogni risposta di GET /challenges/{token}/compare. 6 test in backend/tests/test_compatibility_engine.py.
<!-- SECTION:NOTES:END -->
