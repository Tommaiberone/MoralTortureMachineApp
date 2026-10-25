---
id: TASK-377
title: 'Push rematch: avvisare l''altro partecipante quando chiedono la rivincita'
status: In Progress
assignee: []
created_date: '2026-10-25 14:45'
updated_date: '2026-10-25 15:01'
labels:
  - growth
  - retention
  - notifications
  - duel
dependencies:
  - TASK-275
priority: medium
ordinal: 278000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quando un partecipante crea un rematch (POST /challenges/{token}/rematch) l'altro riceve una notifica con link alla nuova sfida. Topic duel, trigger duel_rematch, nessun nome nel testo. Offerta di iscrizione anche sulla schermata del confronto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il rematch notifica l'altro partecipante (creator o invitee del Duel originale) senza far fallire la richiesta se l'invio non riesce
- [x] #2 Il link della notifica apre la nuova sfida con utm_source=push e utm_campaign=duel_rematch
- [x] #3 Prompt di iscrizione (topic duel) sulla schermata del confronto; test backend, lint e build passano
- [ ] #4 Prima consegna reale di un rematch verificata dall'utente su un browser
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-25: implementato (ADR-162). _notify_duel_rematch avvisa l'altro partecipante (non chi chiede), best-effort, link /challenge/{nuovo}?utm_source=push&utm_campaign=duel_rematch; prompt di iscrizione sulla schermata del confronto. L'AC finale resta aperta fino a una consegna reale.
<!-- SECTION:NOTES:END -->
