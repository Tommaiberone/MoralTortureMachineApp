---
id: TASK-310
title: >-
  Estrarre un componente condiviso per il pattern 'sequenza fissa di dilemmi'
  duplicato 3 volte
status: To Do
assignee: []
created_date: '2026-09-23 09:34'
labels: []
dependencies: []
priority: low
ordinal: 211000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-291 ha aggiunto BookChapterEntryScreen.jsx (frontend/src/screens/), che reimplementa lo stesso pattern UI 'sequenza ordinata e fissa di dilemmi: card, bottoni risposta, tease, pie chart, next/submit' gia' presente in EvaluationDilemmasScreen.jsx (flusso random /get-dilemma, MAX_DILEMMAS=5) e ChallengeLandingScreen.jsx (flusso fisso /dilemmas/by-ids per l'invitato di un Duel). BookChapterEntryScreen riusa il file CSS di ChallengeLandingScreen (nessun CSS duplicato) ma la logica JSX (fetch, gestione voto, tease, grafico, avanzamento) e' ora copiata una terza volta. Non estratto in TASK-291 stesso per non toccare due schermate gia' in produzione e strumentate con esperimenti A/B (rischio di regressione senza beneficio funzionale immediato) - vedi doc-1, sezione book/. Deduplicare ora che il pattern si ripete 3 volte, per CLAUDE.md 'Reuse and unify over duplicating'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un componente o hook condiviso incapsula il pattern fetch-dilemma-corrente/vota/tease/pie-chart/avanza, parametrizzato per sorgente dilemmi (random con exclude vs lista fissa ordinata) e per destinazione finale (risultati singoli vs confronto Duel vs libro)
- [ ] #2 EvaluationDilemmasScreen, ChallengeLandingScreen e BookChapterEntryScreen lo consumano tutti e tre, senza regressioni comportamentali o di analytics verificabili (stessi eventi trackEvent, stesse condizioni di completamento)
- [ ] #3 Nessuna duplicazione JSX residua del blocco 'answer buttons / tease / pie chart' tra i tre file
<!-- AC:END -->
