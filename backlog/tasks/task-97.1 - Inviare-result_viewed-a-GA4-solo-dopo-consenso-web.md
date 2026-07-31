---
id: TASK-97.1
title: Inviare result_viewed a GA4 solo dopo consenso web
status: In Progress
assignee: []
created_date: '2026-07-31 08:38'
updated_date: '2026-07-31 08:45'
labels:
  - growth
  - seo
  - analytics
  - privacy
  - web
dependencies: []
parent_task_id: TASK-97
priority: medium
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dopo consenso GA4 granted, il completamento del primo risultato invia un evento GA4 result_viewed senza email, ID utente, risposte o token.
- [x] #2 Senza consenso non viene caricato il tag e non viene inviato alcun evento GA4.
- [ ] #3 Il report Growth Intelligence riceve almeno una riga di conversione organica dopo traffico reale e mantiene invariata la pipeline analytics first-party.
<!-- AC:END -->

## Implementation Notes

Implementato 2026-07-31: `ResultsScreen` chiama il wrapper GA4 soltanto dopo
l'evento first-party. Il wrapper richiede piattaforma web, consenso `granted`,
Measurement ID configurato e tag già caricato; invia il solo nome
`result_viewed`, senza proprietà. Resta da validare #3 con traffico organico
reale dopo il deploy web.
