---
id: TASK-300.3
title: >-
  Analytics: limitare abuse monitoring e recentEvents a una finestra breve fissa
  invece dell'intero range 'days' richiesto
status: Done
assignee: []
created_date: '2026-09-10 15:12'
updated_date: '2026-09-10 16:28'
labels: []
dependencies:
  - TASK-300.1
parent_task_id: TASK-300
priority: high
type: enhancement
ordinal: 199000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Categoria C di ADR-137/TASK-300: build_abuse_monitoring (riga ~4489) e il campo recentEvents (righe ~5082-5094) hanno bisogno di righe grezze verbatim (sequenza minuto-per-minuto per identita' per il primo; gli ultimi 60 eventi con le loro proprieta' per il secondo) e non sono aggregabili senza perdere lo scopo per cui esistono. Non serve pero' scansionare l'intero range 'days' (fino a 90 giorni) selezionato dall'utente per queste due sezioni: bastano una finestra breve e fissa (es. ultime 24-48h), letta con una Query delimitata da data invece di uno Scan completo.

Scope:
- Introdurre una lettura delimitata da data (Query su un GSI esistente o nuovo, non Scan) per la sola finestra breve fissa richiesta da abuseMonitoring/recentEvents.
- Scollegare questi due pannelli dal selettore 'days' della UI: restano sempre calcolati sulla stessa finestra breve, indipendentemente dal periodo scelto per il resto della dashboard.
- Aggiornare AnalyticsAdminScreen.jsx per comunicare chiaramente (label/tooltip) che questi due pannelli mostrano sempre 'ultime N ore', non il periodo selezionato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 build_abuse_monitoring e recentEvents leggono solo una finestra breve e fissa (es. ultime 24-48h) tramite una Query delimitata da data, non uno Scan dell'intero range days richiesto
- [x] #2 Il comportamento di rilevamento anomalie (soglie, ragioni, rischio) resta identico a quello attuale sulla finestra breve, verificato con test esistenti/nuovi
- [x] #3 La UI (AnalyticsAdminScreen) indica chiaramente che questi due pannelli non seguono il selettore days
- [x] #4 Nessuna riga grezza viene eliminata o compattata prematuramente: il TTL a 90 giorni e i flussi di export/cancellazione restano invariati
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta una nuova GSI sparsa DayIndex (hash dayKey, range timestamp/occurredAt) su user_analytics e product_events; dayKey scritto da track_analytics_event/ingest_analytics_events riusando _analytics_day_key. RECENT_ACTIVITY_WINDOW_HOURS=48: _read_recent_activity_rows fa una Query per ciascun day-key bucket della finestra (mai uno Scan). build_analytics_overview accetta recent_activity_rows e calcola abuseMonitoring/recentEvents da questi dati invece che da events, rispettando ancora il filtro platform ma ignorando days; la risposta espone abuseMonitoring.windowHours e recentEventsWindowHours cosi' il frontend non deve indovinare/hardcodare il valore. AnalyticsAdminScreen.jsx mostra ora esplicitamente 'ultime 48 ore' sotto entrambi i pannelli (chiave i18n fixedRecentWindow, solo en.json per l'eccezione it.json). Righe scritte prima di questo deploy non hanno dayKey e sono semplicemente assenti dal nuovo indice: si auto-risolve entro 48h, nessun backfill necessario per questa finestra breve (diverso da TASK-300.4 che copre lo storico fino a 90 giorni delle tabelle aggregate). analytics_overview continua a fare _scan_all_rows per dataQuality/summary e il fallback A/B in questo step - la rimozione completa degli Scan resta TASK-300.5. Verificato: 5 nuovi test dedicati piu' i 224 test backend esistenti, pnpm lint e pnpm build:prod puliti (nessuna verifica browser dal vivo, come da linea guida CLAUDE.md). Deploy in produzione verificato (terraform apply con le nuove GSI + health check).
<!-- SECTION:FINAL_SUMMARY:END -->
