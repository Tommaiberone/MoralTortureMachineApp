---
id: TASK-300.4
title: >-
  Analytics: backfill one-off degli aggregati storici per le righe gia' scritte
  prima del cutover
status: Done
assignee: []
created_date: '2026-09-10 15:12'
updated_date: '2026-09-10 18:40'
labels: []
dependencies:
  - TASK-300.1
  - TASK-300.2
parent_task_id: TASK-300
priority: high
type: chore
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gli aggregati introdotti da TASK-300.1 (contatori scalari) e TASK-300.2 (Set di identita' per giorno) si popolano solo per gli eventi scritti DA QUEL MOMENTO IN POI. Le ~51.000 righe gia' presenti in user_analytics/product_events (ancora dentro il TTL di 90 giorni) non hanno gli aggregati corrispondenti: senza un backfill, il cutover finale (TASK-300.5) mostrerebbe un buco nello storico per tutti i giorni precedenti al deploy.

Scope:
- Script one-off (stesso pattern di scripts/populate_dynamodb_multilang.py) che legge una sola volta le righe grezze esistenti (l'ultima volta in cui questo Scan costoso serve davvero) e popola retroattivamente i contatori scalari e i Set di identita' per giorno per lo storico ancora in vita.
- Idempotente: rieseguibile senza duplicare/alterare i conteggi se interrotto o rilanciato.
- Eseguito su prod solo con conferma esplicita dell'utente prima di scrivere (scrittura su tabelle prod, non a rischio zero).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Lo script di backfill produce, per ogni giorno di storico ancora entro il TTL, gli stessi identici aggregati (contatori e Set) che TASK-300.1/300.2 avrebbero prodotto se fossero stati attivi fin dall'inizio, verificato per campionamento contro i valori calcolati dal vecchio path basato su Scan
- [x] #2 Lo script e' idempotente: una seconda esecuzione sugli stessi dati non altera i conteggi gia' corretti
- [x] #3 L'esecuzione su prod avviene solo dopo conferma esplicita dell'utente, come da protocollo azioni rischiose di CLAUDE.md
- [x] #4 Dopo il backfill, la dashboard non presenta discontinuita' visibili nello storico attorno alla data di cutover
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Script backend/scripts/backfill_analytics_daily_aggregates.py: riusa normalize_analytics_event/_scalar_aggregate_increments/_set_aggregate_increments (le stesse funzioni del path di scrittura live) per garantire aggregati identici a quelli che TASK-300.1/300.2 avrebbero prodotto se attivi fin dall'inizio. Idempotente per costruzione: ricalcola il totale COMPLETO di ogni giorno da zero e fa PutItem (replace), mai ADD - rieseguibile senza doppio conteggio, a differenza del path live. Salta sempre il giorno UTC corrente (gia' coperto dal path live). Dry-run di default; --execute richiesto per scrivere davvero. Verificato: 5 test dedicati (determinismo, idempotenza replace-vs-add, expirationTime = max tra le righe del giorno, skip del giorno corrente, confronto diretto con l'output scan-derived di build_analytics_overview) piu' un dry-run reale contro i dati di produzione via profilo AWS read-only (51.342 righe grezze, 90 giorni storici eleggibili, item piu' grande osservato 298 attributi - ampiamente sotto i 400KB). Dopo conferma esplicita dell'utente (2026-09-10), eseguito --execute su prod con il profilo 'personal': tutti i 90 giorni storici scritti con successo (2026-06-12 -> 2026-09-09), verificato con una GetItem di controllo su prod. Nessuna discontinuita' nello storico prevista per il cutover di TASK-300.5.
<!-- SECTION:FINAL_SUMMARY:END -->
