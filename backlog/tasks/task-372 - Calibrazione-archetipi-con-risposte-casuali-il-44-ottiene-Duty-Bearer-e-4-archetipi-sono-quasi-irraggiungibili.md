---
id: TASK-372
title: >-
  Calibrazione archetipi: con risposte casuali il 44% ottiene Duty-Bearer e 4
  archetipi sono quasi irraggiungibili
status: To Do
assignee: []
created_date: '2026-09-30 13:55'
labels:
  - archetypes
  - content
dependencies:
  - TASK-228
priority: medium
ordinal: 273000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Simulazione 2026-09-30 (5 dilemmi casuali dal pool attuale, 20000 sessioni): risposte casuali => steadfast_enforcer 44%, self_preservationist 12%; tragic_principled 0%, ruthless_pragmatist 0.6%, blind_avenger 0.3%, honest_opportunist 0.3%. Chi risponde sempre con la prima risposta ottiene Duty-Bearer 55% o Moral Idealist 24%. Cause: bias di livello nei punteggi (task sui bias), centroidi a soli tre livelli (0.2/0.5/0.85) e media su 5 risposte che regredisce al centro. Rivalutare centroidi e/o aggiungere un secondo livello di scoring dopo la correzione dei punteggi, rifacendo la simulazione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Simulazione ripetuta dopo la correzione dei punteggi, con distribuzione per archetipo con risposte casuali
- [ ] #2 Nessun archetipo assegnato a piu' del 20% delle sessioni casuali e nessuno sotto l'1%, oppure soglie diverse concordate
- [ ] #3 Decisione su archetypesVersion e ADR aggiornato
<!-- AC:END -->
