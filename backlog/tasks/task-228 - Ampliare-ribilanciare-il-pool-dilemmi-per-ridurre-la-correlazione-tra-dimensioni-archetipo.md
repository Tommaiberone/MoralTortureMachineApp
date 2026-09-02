---
id: TASK-228
title: >-
  Ampliare/ribilanciare il pool dilemmi per ridurre la correlazione tra
  dimensioni archetipo
status: To Do
assignee: []
created_date: '2026-09-02 08:20'
labels:
  - growth
  - product
  - archetypes
  - content
dependencies:
  - TASK-142
priority: medium
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-142 (decisione presa 2026-09-02, opzione b). I valori per categoria nei risultati (Empathy/Integrity/Responsibility/Justice/Altruism/Honesty) sembrano generici perche' le 6 dimensioni sono fortemente correlate (0.65-0.86 su alcune coppie) - ogni dilemma e' scritto come opzione 'dura' vs 'protettiva' che muove tutte le dimensioni in blocco, quindi una scelta esprime davvero solo 1-2 segnali reali distribuiti su 6 assi. Il pool e' cresciuto da 17 a 44 dilemmi da quando l'analisi originale e' stata fatta (TASK-201). Primo passo: ri-misurare la correlazione tra dimensioni sui 44 dilemmi attuali prima di scrivere nuovo contenuto, per capire se i 27 dilemmi aggiunti da TASK-201 hanno gia' ridotto il problema parzialmente. Poi scrivere/riscrivere dilemmi le cui due opzioni non muovano le stesse dimensioni in blocco (es. un'opzione che sacrifica Justice per Empathy senza toccare Honesty/Integrity).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Correlazione tra le 6 dimensioni ri-misurata sui 44 dilemmi attuali, con numeri concreti su quanto TASK-201 ha gia' mosso l'ago
- [ ] #2 Nuovi dilemmi o riscritture riducono le correlazioni piu' alte (attualmente 0.65-0.86) sotto una soglia concordata
- [ ] #3 Se la ricalibrazione sposta sensibilmente le distribuzioni per-dimensione, concordato un bump di archetypesVersion (ADR-025) prima del deploy
- [ ] #4 Verificato che l'ampliamento non degrada l'effetto di regressione verso il centro dovuto alla media su MAX_DILEMMAS
<!-- AC:END -->
