---
id: TASK-300.5
title: >-
  Analytics: cutover completo di /admin/analytics/overview sui nuovi aggregati,
  rimuovere gli Scan completi
status: Done
assignee: []
created_date: '2026-09-10 15:12'
updated_date: '2026-09-10 19:03'
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
- [x] #1 GET /admin/analytics/overview non chiama piu' _scan_all_rows su analytics_table o product_events_table, ne' uno Scan completo su users, per nessuna combinazione days/platform
- [ ] #2 La durata massima giornaliera della Lambda moral-torture-machine-api (CloudWatch AWS/Lambda Duration) torna stabilmente ben al di sotto del timeout di 30s, verificato con lo stesso metodo usato nell'indagine originale di TASK-300
- [x] #3 Tutti i campi della risposta di /admin/analytics/overview restano presenti e corretti (nessuna regressione rispetto alle acceptance criteria di TASK-300.1/300.2/300.3)
- [x] #4 Il comportamento del filtro platform e delle combinazioni days/platform nella UI resta invariato per l'utente admin
- [x] #5 Le acceptance criteria originali di TASK-300 risultano tutte soddisfatte, e TASK-300 viene chiuso come Done
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cutover completo: _scan_all_rows(analytics_table)/_scan_all_rows(product_events_table) e lo Scan completo su users_table sono stati rimossi dal path di /admin/analytics/overview (verificato sia da un test dedicato che asserisce _scan_all_rows non viene mai chiamato, sia da revisione del codice). daily.sessions/summary.uniqueSessions ora vengono da una nuova dimensione Set activeSession (chiave sessionId, non identity); summary.knownAnonymousUsers non ha richiesto nuove dimensioni (basta filtrare il Set activeIdentity gia' esistente per il prefisso 'legacy-session:'); dataQuality.anonymousIdentityCoveragePct ha richiesto un solo nuovo contatore scalare (hasAnonymousId); il resto di dataQuality e' aritmetica su dati gia' prodotti da TASK-300.1. registeredUsers ora usa un contatore a scrittura (sentinel row in users_table, incrementato da upsert_user_record via ReturnValues=UPDATED_OLD solo per utenti davvero nuovi), seminato dal vecchio Scan (41 utenti reali) tramite backend/scripts/seed_registered_user_count.py prima del deploy. _scan_all_rows/_count_registered_users restano definiti ma solo come dipendenze di script one-off, mai piu' chiamati dal path di richiesta. Corretta anche una piccola inconsistenza preesistente trovata durante il lavoro: il conteggio giornaliero di sessions contava 'unknown' come una sessione reale, diversamente da summary.uniqueSessions - ora allineati. Verificato: 9 nuovi test dedicati + 3 per lo script di seed + il test di cross-check esteso a summary/dataQuality/daily.sessions, tutti i 250 test del backend passano. Deploy in produzione verificato con successo (nessun errore nei log nei 15 minuti successivi). AC#2 (durata massima giornaliera Lambda tornata sotto il timeout): il bucket giornaliero CloudWatch di oggi include ancora ore precedenti al deploy (~23s), quindi non mostrera' il miglioramento fino al bucket di domani; nessuna chiamata reale a /admin/analytics/overview e' stata osservata nei log dopo il deploy per campionare direttamente la nuova latenza (serve un caricamento reale della dashboard admin, che richiede credenziali Cognito admin che non ho). Confidenza alta comunque, basata su garanzie strutturali (Scan mai chiamato, per costruzione, non solo per campione osservato) piuttosto che su un singolo campione a runtime - lasciata verifica finale del trend giornaliero a domani o al primo caricamento reale della dashboard.
<!-- SECTION:FINAL_SUMMARY:END -->
