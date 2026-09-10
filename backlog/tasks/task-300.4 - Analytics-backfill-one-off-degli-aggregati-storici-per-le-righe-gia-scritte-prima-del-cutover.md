---
id: TASK-300.4
title: >-
  Analytics: backfill one-off degli aggregati storici per le righe gia' scritte
  prima del cutover
status: To Do
assignee: []
created_date: '2026-09-10 15:12'
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
- [ ] #1 Lo script di backfill produce, per ogni giorno di storico ancora entro il TTL, gli stessi identici aggregati (contatori e Set) che TASK-300.1/300.2 avrebbero prodotto se fossero stati attivi fin dall'inizio, verificato per campionamento contro i valori calcolati dal vecchio path basato su Scan
- [ ] #2 Lo script e' idempotente: una seconda esecuzione sugli stessi dati non altera i conteggi gia' corretti
- [ ] #3 L'esecuzione su prod avviene solo dopo conferma esplicita dell'utente, come da protocollo azioni rischiose di CLAUDE.md
- [ ] #4 Dopo il backfill, la dashboard non presenta discontinuita' visibili nello storico attorno alla data di cutover
<!-- AC:END -->
