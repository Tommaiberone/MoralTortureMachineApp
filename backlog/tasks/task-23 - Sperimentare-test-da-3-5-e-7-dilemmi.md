---
id: TASK-23
title: 'Sperimentare test da 3, 5 e 7 dilemmi'
status: In Progress
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-07 13:22'
labels:
  - m2-activation
  - experiment
  - analytics
dependencies:
  - TASK-6
  - TASK-22
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Assegnazione persistente delle varianti e misura end-to-end di completamento, qualità del risultato e condivisione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'assegnazione variante è stabile e presente negli eventi
- [x] #2 Ogni variante produce un risultato valido
- [ ] #3 Il report confronta completion e result-to-share
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-07: implementata l'assegnazione variante (EvaluationDilemmasScreen.jsx). Split deterministico 1/3/1/3/1/3 tramite hash djb2 dell'anonymous_user_id gia' esistente (nessun nuovo storage key, nessuna chiamata backend), stabile per la stessa identita' tra visite successive. maxDilemmas sostituisce la costante MAX_DILEMMAS=7 hardcoded ovunque nel componente (loop dei dilemmi, subtitle, prefetch, eventi analytics). Verificato che 3/5 risposte restano valide lato backend: CreateProfileRequest/AnalyzeResultsRequest non hanno vincoli min/max sul numero di risposte, compute_dimension_averages fa semplicemente la media su N risposte (ogni dilemma pesa gia' tutte e 6 le dimensioni), nessun prompt Groq assume un conteggio fisso. AC1 e AC2 soddisfatti: la variante e' gia' presente negli eventi esistenti (planned_dilemmas/completed_dilemmas/num_dilemmas su test_started/test_completed/result_viewed/results_analyzed erano gia' calcolati dinamicamente dal conteggio reale, non hardcoded a 7) e ogni variante produce un risultato valido per costruzione. AC3 (report che confronta completion e result-to-share tra varianti) lasciato aperto: oggi non esiste ancora traffico reale sulle varianti 3 e 5, un confronto ora sarebbe rumore su n=0. Non fissata una data rigida come TASK-166/167, ma indicativamente non prima di ~2 settimane di traffico reale su tutte e tre le varianti (coerente con la cadenza gia' usata per gli altri growth check). pnpm lint e build:prod puliti; corretto anche un gap di lint pre-esistente non catturato nel commit precedente (frontend/terraform/functions/og-bot-router.js veniva lintato come codice applicativo e falliva su no-unused-vars per la funzione handler richiesta dal runtime CloudFront - escluso terraform/** da eslint.config.js).
<!-- SECTION:NOTES:END -->
