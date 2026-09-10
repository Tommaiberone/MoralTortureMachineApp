---
id: TASK-300.3
title: >-
  Analytics: limitare abuse monitoring e recentEvents a una finestra breve fissa
  invece dell'intero range 'days' richiesto
status: To Do
assignee: []
created_date: '2026-09-10 15:12'
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
- [ ] #1 build_abuse_monitoring e recentEvents leggono solo una finestra breve e fissa (es. ultime 24-48h) tramite una Query delimitata da data, non uno Scan dell'intero range days richiesto
- [ ] #2 Il comportamento di rilevamento anomalie (soglie, ragioni, rischio) resta identico a quello attuale sulla finestra breve, verificato con test esistenti/nuovi
- [ ] #3 La UI (AnalyticsAdminScreen) indica chiaramente che questi due pannelli non seguono il selettore days
- [ ] #4 Nessuna riga grezza viene eliminata o compattata prematuramente: il TTL a 90 giorni e i flussi di export/cancellazione restano invariati
<!-- AC:END -->
