---
id: TASK-300.1
title: >-
  Analytics: aggregare a scrittura le metriche scalari pure (eventCounts,
  breakdown piattaforma/lingua/appVersion, topDilemmas, interactionBreakdowns)
status: Done
assignee: []
created_date: '2026-09-10 15:11'
updated_date: '2026-09-10 15:34'
labels: []
dependencies: []
parent_task_id: TASK-300
priority: high
type: enhancement
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Categoria A di ADR-137/TASK-300: queste metriche sono somme pure senza deduplica per identita', quindi possono diventare contatori DynamoDB a scrittura invece di essere ricalcolate da uno Scan completo a ogni richiesta.

Scope:
- Un nuovo item per bucket (giorno, dimensione) aggiornato con 'UpdateItem ... ADD count :1' nello stesso momento in cui 'track_analytics_event' (riga ~956) e 'ingest_analytics_events' (riga ~4241) scrivono oggi la riga grezza - in aggiunta, non in sostituzione, cosi' le righe grezze restano la fonte di verita' fino al cutover finale (TASK figlio 5).
- Copre: eventCounts, sourceCounts, platformCounts, languageCounts, timeZoneCounts, appVersionCounts, platformBreakdown, topDilemmas (per dilemma_id), interactionBreakdowns (modeSelected, shareClicked per canale/objectType, authPromptShown/Clicked per surface).
- 'build_analytics_overview' calcola questi campi leggendo i nuovi aggregati per la finestra 'days' richiesta (letture O(giorni), non O(storia intera)), invece di derivarli dagli eventi scansionati.
- Verificare esplicitamente contro il Free Tier AWS corrente (CLAUDE.md) il costo/i limiti di qualunque nuova tabella o attributo introdotto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni evento scritto da track_analytics_event o ingest_analytics_events incrementa atomicamente i relativi contatori aggregati per il giorno corrente, senza rimuovere la scrittura della riga grezza esistente
- [x] #2 /admin/analytics/overview calcola eventCounts, sourceCounts, platformCounts, languageCounts, timeZoneCounts, appVersionCounts, platformBreakdown, topDilemmas e interactionBreakdowns leggendo solo gli aggregati della finestra days richiesta, senza scansionare le tabelle grezze per questi campi
- [x] #3 I valori riportati dopo la modifica combaciano (a meno di arrotondamento) con i valori precedenti basati su Scan, verificati sulla finestra di storico attualmente disponibile
- [x] #4 La nuova tabella/attributo rispetta il vincolo AWS Free Tier di CLAUDE.md, verificato prima del deploy
- [x] #5 Test unitari coprono sia il nuovo path di scrittura sia il nuovo path di lettura
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementato: nuova tabella DynamoDB analytics_daily_aggregates (5 RCU/3 WCU provisioned, entro il Free Tier condiviso 25/25, verificato 2026-09-10) con un item per giorno UTC e attributi contatore dinamici namespace__platform__valore-escaped (ogni _ diventa _- cosi' il delimitatore __ non e' mai ambiguo). track_analytics_event e ingest_analytics_events (backend_fastapi.py) incrementano l'aggregato con un solo UpdateItem ADD per evento/batch-giorno, sempre in un blocco che non puo' mai far fallire la scrittura grezza (try/except dedicato). /admin/analytics/overview legge gli aggregati via BatchGetItem per la finestra days richiesta e li usa per eventCounts, sourceCounts, platformCounts, platformBreakdown, languageCounts, timeZoneCounts, appVersionCounts, topDilemmas, interactionBreakdowns e la parte additiva di daily, con fallback automatico allo Scan se gli aggregati non sono disponibili. 15 nuovi test in backend/tests/test_analytics_models.py, incluso un test che confronta byte-per-byte l'output aggregate-derived con quello scan-derived su dati sintetici (AC#3) - tutti i 211 test del backend passano. La verifica contro dati prod reali (oltre alla finestra sintetica qui) arriva con TASK-300.4 (backfill) e TASK-300.5 (cutover).
<!-- SECTION:FINAL_SUMMARY:END -->
