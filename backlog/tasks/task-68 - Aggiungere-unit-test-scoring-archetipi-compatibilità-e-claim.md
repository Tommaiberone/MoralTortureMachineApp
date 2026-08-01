---
id: TASK-68
title: Aggiungere unit test scoring archetipi compatibilità e claim
status: Done
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-01 07:40'
labels:
  - m10-quality
  - testing
  - backend
dependencies:
  - TASK-13
  - TASK-26
  - TASK-37
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Suite deterministica per funzioni core e migrazione identità.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Boundary e regressioni note sono coperte
- [x] #2 Fixture sono versionate
- [x] #3 Test non dipendono da Groq o rete
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Verificato che il lavoro delle sessioni precedenti (ADR-025 archetipi, ADR-027 claim, TASK-37 compatibilita') soddisfa gia' interamente questo task, solo mai marcato Done: backend/tests/test_archetype_engine.py copre ogni archetipo al proprio centroide, un caso limite di parita' deterministica (ruthless_pragmatist/noble_liar), versioning (asserisce su get_archetypes_version()/reference['version']), fallback dimensione mancante, localizzazione IT/EN; backend/tests/test_compatibility_engine.py copre simmetria, profili identici/opposti, versione, dimensione mancante; backend/tests/test_users.py copre il claim idempotente (primo claim, ripetizione no-op, claim conflittuale 409). Tutti e tre i file usano solo funzioni pure o mock (nessuna chiamata Groq o rete reale). Eseguita l'intera suite (79 test, tutti pass) come verifica finale.
<!-- SECTION:FINAL_SUMMARY:END -->
