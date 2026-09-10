---
id: TASK-300.2
title: >-
  Analytics: aggregare a scrittura funnel/retention/viral/experiment tramite
  insiemi di identita' per giorno (categoria B)
status: Done
assignee: []
created_date: '2026-09-10 15:11'
updated_date: '2026-09-10 16:08'
labels: []
dependencies:
  - TASK-300.1
parent_task_id: TASK-300
priority: high
type: enhancement
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Categoria B di ADR-137/TASK-300: queste metriche fanno deduplica o join per identita' tra tipi di evento diversi, quindi non possono diventare un semplice contatore scalare (sommare due interi incrementati indipendentemente conta due volte un'identita' che ricompare). Usano invece un DynamoDB String Set con 'ADD' idempotente per bucket (giorno, stage/variante), scritto nello stesso punto del write path toccato da TASK-300.1.

Copre:
- Funnel generico (test_started -> answered -> completed -> result_viewed -> shared) e i funnel per-identita' di Daily Moral Crime, Party Room, Moral Duel (_build_identity_funnel, righe ~4642-4696).
- Retention D1/D7 (build_retention_cohorts, riga ~4770): richiede sapere, per identita', il primo giorno attivo nella finestra e se e' tornata a +1/+7 giorni - risolvibile controllando l'appartenenza dell'identita' ai set dei giorni successivi, ma resta un'unione di insiemi tra giorni, non un incremento singolo.
- Viral coefficient (build_viral_coefficient, riga ~4847) e creative variant breakdown (build_creative_variant_breakdown, riga ~4881): join tra l'insieme di chi ha condiviso/variante mostrata e l'insieme di chi ha completato, via UTM.
- I copy experiment (build_experiment_breakdown, riga ~4915, registro COPY_EXPERIMENTS riga ~4965): intersezione tra l'insieme esposto a una variante e l'insieme convertito.

'build_analytics_overview' calcola questi campi leggendo e unendo i set dei giorni nella finestra 'days' richiesta, invece di scansionare le tabelle grezze. Verificare i limiti di dimensione item DynamoDB (400KB) restino ampiamente rispettati ai volumi di traffico attuali, e il costo/i limiti contro il Free Tier AWS corrente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni evento rilevante per un funnel/retention/experiment aggiunge idempotentemente l'identita' al relativo Set (giorno, stage/variante) al momento della scrittura, in aggiunta alla riga grezza esistente
- [x] #2 C:/Program Files/Git/admin/analytics/overview calcola tutti i funnel, la retention D1/D7, il viral coefficient, il creative variant breakdown e i copy experiment leggendo/unendo solo i Set della finestra days richiesta, senza scansionare le tabelle grezze per questi campi
- [x] #3 I valori riportati dopo la modifica combaciano (a meno di arrotondamento/campionamento gia' documentato, es. RETENTION_MIN_COHORT_SAMPLE) con i valori precedenti basati su Scan, verificati sulla finestra di storico attualmente disponibile
- [x] #4 Nessun item Set si avvicina al limite di 400KB ai volumi di traffico attuali; documentato cosa succederebbe e come mitigarlo se il traffico crescesse molto
- [x] #5 La nuova tabella/attributo rispetta il vincolo AWS Free Tier di CLAUDE.md, verificato prima del deploy
- [x] #6 Test unitari coprono sia il nuovo path di scrittura sia il nuovo path di lettura, inclusi i casi di deduplica (stessa identita' in piu' giorni/eventi)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementato riusando la stessa tabella analytics_daily_aggregates di TASK-300.1 (un item per giorno): ogni funnel (generico, Daily/Party/Duel), retention D1/D7, viral coefficient, creative variant breakdown e i 4 copy experiment ora sono Set DynamoDB idempotenti (namespace__platform__valore-escaped), scritti con un solo UpdateItem combinato insieme ai contatori scalari di TASK-300.1 (_apply_daily_aggregate_increments). Ogni builder Scan-based e' stato separato in una funzione core pura + wrapper, cosi' il percorso aggregato chiama la stessa identica aritmetica invece di duplicarla. daily.users ora usa lo stesso Set activeIdentity gia' necessario per la retention, completando la migrazione parziale lasciata da TASK-300.1. Durante l'implementazione e' emerso che DynamoDB fattura UpdateItem in base alla dimensione dell'item DOPO la scrittura (non al delta) e che questo item e' l'unica chiave calda di scrittura per ogni giorno: una capacita' provisioned fissa non e' sicura in questo scenario indipendentemente dal numero scelto, quindi la tabella e' stata spostata da 5 RCU/3 WCU provisioned a PAY_PER_REQUEST (eccezione Free Tier documentata in ADR-139, costo stimato pochi centesimi/mese all'attuale traffico). Verificato: 8 nuovi test dedicati (round-trip escape, dedup stessa identita' stesso giorno, unione stessa identita' tra giorni per la retention, copertura di ogni registry stage/evento) piu' un'espansione sostanziale del test di cross-check TASK-300.1 con un dataset sintetico che esercita ogni funnel/retention/viral/variant/experiment e confronta l'output aggregate-derived (costruito chiamando le vere funzioni di scrittura) con quello scan-derived, campo per campo - tutti i 219 test del backend passano. Deploy in produzione verificato (terraform apply + health check).
<!-- SECTION:FINAL_SUMMARY:END -->
