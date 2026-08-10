---
id: TASK-177.3
title: Card archetipo su /account con l'endpoint del profilo piu' recente
status: To Do
assignee: []
created_date: '2026-08-10 09:33'
labels:
  - frontend
  - growth
dependencies:
  - TASK-177.2
parent_task_id: TASK-177
priority: medium
type: enhancement
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dipende da TASK-177.2 (endpoint backend). Renderizzare su /account la card dell'archetipo corrente riusando lo stile visivo di .results-archetype (ResultsScreen.jsx/css) per coerenza con una UI gia' familiare all'utente, piu' un CTA secondario 'Retake the test'. Stato vuoto esplicito se l'utente non ha ancora completato un test (CTA primario a fare il test, non un errore). Vedi mockup: https://claude.ai/code/artifact/32590b56-c0ab-482e-9632-7b4afd21ea82
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un utente autenticato con almeno un test completato vede il proprio archetipo corrente su /account, visivamente coerente con la card di ResultsScreen
- [ ] #2 Un utente autenticato senza test completati vede uno stato vuoto con CTA a fare il test, non un errore o una card vuota silenziosa
<!-- AC:END -->
