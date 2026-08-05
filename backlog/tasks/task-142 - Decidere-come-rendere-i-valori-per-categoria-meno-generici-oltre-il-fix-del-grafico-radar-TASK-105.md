---
id: TASK-142
title: >-
  Decidere come rendere i valori per categoria meno generici oltre il fix del
  grafico radar (TASK-105)
status: Open Points
assignee: []
created_date: '2026-08-05 08:53'
updated_date: '2026-08-05 08:53'
labels:
  - growth
  - product
  - archetypes
  - content
dependencies: []
priority: medium
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-105. Oltre al bug del grafico radar (gia' corretto: dominio fisso invece di autoscalare), l'investigazione ha trovato due cause piu' profonde per cui i valori per categoria (Empathy/Integrity/Responsibility/Justice/Altruism/Honesty) sembrano generici e poco personalizzati, entrambe verificate sui dati reali in backend/data/dilemmas_en.json (17 dilemmi, 204 valori per-risposta): (1) le 6 dimensioni sono fortemente correlate tra loro (es. Integrity/Justice/Honesty correlano 0.65-0.86, Responsibility/Altruism 0.82) perche' ogni dilemma e' scritto come un'opzione 'pragmatica/dura' vs una 'protettiva/leale' con punteggi alti/bassi in blocco sulle stesse dimensioni insieme - quindi la scelta di una persona esprime davvero solo 1-2 segnali reali ma viene distribuita su 6 assi che si muovono in blocco, producendo esagoni dalla forma simile per tutti; (2) la media su 7 dilemmi (MAX_DILEMMAS, EvaluationDilemmasScreen.jsx) su un pool di soli 17 regredisce verso il centro della popolazione (media per dimensione in banda 0.56-0.70) a meno di risposte molto coerenti. Nessuna delle due e' un bug: sono scelte di content/scoring che toccano il sistema di archetipi deterministico e versionato (ADR-025, doc-1) - una modifica ai pesi/dimensioni o ai centroidi degli archetipi richiederebbe un bump di archetypesVersion. Serve una decisione su quale strada seguire prima di implementare qualunque fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decisa la direzione: (a) ridurre/ridisegnare le dimensioni mostrate ai 2-3 fattori latenti reali, (b) ampliare/ribilanciare il pool di dilemmi per ridurre la correlazione tra dimensioni, (c) mostrare il punteggio come percentile rispetto alla popolazione invece che media assoluta, o (d) nessuna azione per ora
- [ ] #2 Se la scelta tocca dimensioni/pesi/centroidi degli archetipi, concordato il bump di versione dell'archetype engine (ADR-025) prima dell'implementazione
<!-- AC:END -->
