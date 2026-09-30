---
id: TASK-369
title: >-
  gamebook_waitlist_signup tracciato due volte, dal server e dal client, con lo
  stesso nome
status: Backlog
assignee: []
created_date: '2026-09-30 13:34'
labels:
  - analytics
  - gamebook
  - bug
dependencies: []
priority: low
ordinal: 270000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato nell'analisi analytics del 2026-09-30. join_gamebook_waitlist (backend_fastapi.py) emette _track_duel_event(request, 'gamebook_waitlist_signup', {}) dopo il put_item, e GamebookWaitlist.jsx manda trackEvent('gamebook_waitlist_signup', { surface }) dopo il 200: stesso nome dai due sorgenti (legacy e product). eventCounts mostra quindi 48 iscrizioni invece delle 25 reali (25 identita' = 25 email in tabella); le metriche per identita' non sono toccate. La convenzione del progetto per questo caso e' il suffisso _client lato client (vedi challenge_joined_client). Da sistemare prima di TASK-345 (sezione gamebook nella dashboard), che altrimenti mostrerebbe il conteggio doppio.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un solo evento per iscrizione nei conteggi evento, oppure i due eventi hanno nomi distinti secondo la convenzione _client
- [ ] #2 La dimensione surface resta disponibile per lo split home/results
- [ ] #3 Test backend o frontend aggiornati
<!-- AC:END -->
