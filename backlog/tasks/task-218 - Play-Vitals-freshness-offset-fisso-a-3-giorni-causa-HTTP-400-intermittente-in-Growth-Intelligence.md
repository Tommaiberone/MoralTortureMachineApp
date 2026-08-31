---
id: TASK-218
title: >-
  Play Vitals freshness offset fisso a 3 giorni causa HTTP 400 intermittente in
  Growth Intelligence
status: To Do
assignee: []
created_date: '2026-08-31 14:28'
updated_date: '2026-08-31 14:29'
labels:
  - growth
  - aso
  - analytics
  - automation
dependencies: []
priority: low
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/growth_intelligence.py collect() calcola end = date.today() - timedelta(days=3) per la finestra Search Console/GA4/Vitals (linea 729). Confermato leggendo 3 run reali del workflow growth-intelligence.yml: il run del 2026-08-24 ha fallito con 'Google Play Android Vitals: HTTP 400 (INVALID_ARGUMENT: timeline_spec.end_date field should be at most the current freshness 2026-08-20 00:00)' - quel giorno la vera finestra di freshness dei Android Vitals era di 4 giorni, uno in piu' del margine fisso assunto dallo script. I due run precedenti (2026-08-17, 2026-08-10) non avevano questo errore, quindi non e' una rottura permanente ma un fallimento intermittente ogni volta che la reale latenza di Vitals supera i 3 giorni assunti. Il workflow non blocca il report (errore raccolto e mostrato in configuration.errors, TASK-98/doc-1 'non trasforma un errore di fonte in un fallimento di prodotto'), ma quella settimana i dati Vitals restano vuoti senza un motivo ovvio per chi legge il report.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Il margine fisso di 3 giorni per Android Vitals viene aumentato (es. 5-7 giorni) o reso dinamico leggendo il messaggio di errore/la data di freshness effettiva restituita dall'API in caso di HTTP 400
- [ ] #2 Un test in scripts/test_growth_intelligence.py copre il caso in cui la finestra richiesta supera la freshness disponibile
<!-- AC:END -->
