---
id: TASK-300.5
title: >-
  Analytics: cutover completo di /admin/analytics/overview sui nuovi aggregati,
  rimuovere gli Scan completi
status: To Do
assignee: []
created_date: '2026-09-10 15:12'
labels: []
dependencies:
  - TASK-300.1
  - TASK-300.2
  - TASK-300.3
  - TASK-300.4
parent_task_id: TASK-300
priority: high
type: enhancement
ordinal: 201000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Passo finale di ADR-137/TASK-300: con contatori scalari (300.1), Set per giorno (300.2), finestra breve per abuse/recentEvents (300.3) e backfill storico (300.4) tutti a posto, 'build_analytics_overview'/'analytics_overview' possono smettere di leggere le tabelle grezze in blocco.

Scope:
- Rimuovere '_scan_all_rows(analytics_table)' e '_scan_all_rows(product_events_table)' dal path di /admin/analytics/overview (backend_fastapi.py riga ~5175-5177): l'endpoint legge solo i nuovi aggregati/Set per la finestra days richiesta, piu' la finestra breve fissa di TASK-300.3.
- Sostituire '_count_registered_users()' (riga ~4460, Scan completo su users) con un conteggio mantenuto a scrittura (es. contatore incrementato alla creazione utente) o un'altra lettura non a Scan completo.
- Le tabelle grezze user_analytics/product_events restano la fonte di verita' con il loro TTL a 90 giorni invariato; smettono solo di essere lette in blocco dalla dashboard.
- Verificare che nulla in export/cancellazione dati (TASK-15, doc-1) dipenda dal fatto che la dashboard legga le righe grezze in blocco.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /admin/analytics/overview non chiama piu' _scan_all_rows su analytics_table o product_events_table, ne' uno Scan completo su users, per nessuna combinazione days/platform
- [ ] #2 La durata massima giornaliera della Lambda moral-torture-machine-api (CloudWatch AWS/Lambda Duration) torna stabilmente ben al di sotto del timeout di 30s, verificato con lo stesso metodo usato nell'indagine originale di TASK-300
- [ ] #3 Tutti i campi della risposta di /admin/analytics/overview restano presenti e corretti (nessuna regressione rispetto alle acceptance criteria di TASK-300.1/300.2/300.3)
- [ ] #4 Il comportamento del filtro platform e delle combinazioni days/platform nella UI resta invariato per l'utente admin
- [ ] #5 Le acceptance criteria originali di TASK-300 risultano tutte soddisfatte, e TASK-300 viene chiuso come Done
<!-- AC:END -->
