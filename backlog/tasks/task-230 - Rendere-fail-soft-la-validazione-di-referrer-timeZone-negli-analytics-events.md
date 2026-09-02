---
id: TASK-230
title: Rendere fail-soft la validazione di referrer/timeZone negli analytics events
status: Backlog
assignee: []
created_date: '2026-09-02 12:39'
updated_date: '2026-09-02 12:40'
labels:
  - bug
  - frontend
  - backend
  - analytics
dependencies:
  - TASK-198
priority: low
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-198 (chiuso 2026-09-02, causa trovata via CloudWatch durante /ops-alerts-sweep). Su 113 validation error aggregati dal 2026-08-25 a oggi, il 90/113 (~80%) e' 'referrer' value_error e 23/113 (~20%) e' 'timeZone' string_pattern_mismatch - entrambi in AnalyticsEvent (backend_fastapi.py, validate_referrer e il pattern del campo timeZone). Oggi un singolo valore malformato in UNO dei fino a 25 eventi di un batch fa fallire la validazione Pydantic dell'INTERA richiesta POST /analytics/events (422), scartando anche gli eventi validi dello stesso batch - non solo quello con il campo problematico. referrer e timeZone sono dati di attribuzione opzionali, non critici: un valore non valido dovrebbe essere silenziosamente scartato (impostato a None), non far fallire l'intero batch. Ipotesi sulla causa originaria (non confermabile senza loggare il valore raw, che violerebbe la privacy): document.referrer con scheme non-http(s) in contesto Android WebView per referrer; un fuso orario in stile offset (es. GMT+03:00) invece di un nome IANA per timeZone su alcuni WebView/versioni Android.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 validate_referrer non solleva piu' ValueError per un valore malformato: normalizza a None (log privacy-safe di un contatore/flag, mai il valore) invece di rigettare la richiesta
- [ ] #2 Il campo timeZone applica la stessa logica fail-soft invece del pattern Pydantic che rigetta l'intera richiesta
- [ ] #3 Un evento con referrer o timeZone malformato nello stesso batch di altri eventi validi non fa piu' scartare l'intero batch
- [ ] #4 Test aggiunti/aggiornati per entrambi i campi (valore valido, valore malformato normalizzato a None, batch misto), suite backend verde
<!-- AC:END -->
