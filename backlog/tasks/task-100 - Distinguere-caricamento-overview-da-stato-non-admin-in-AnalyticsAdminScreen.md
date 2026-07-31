---
id: TASK-100
title: Distinguere caricamento overview da stato non-admin in AnalyticsAdminScreen
status: Done
assignee: []
created_date: '2026-07-31 09:25'
updated_date: '2026-07-31 09:26'
labels:
  - frontend
  - bug
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In AnalyticsAdminScreen il ramo 'access gate' (quando data e' ancora null) mostra sempre auth.adminPending ('autenticato ma non amministratore') per ogni utente autenticato finche' /admin/analytics/overview non risponde, anche se l'utente e' effettivamente admin e la richiesta e' semplicemente in corso. Il messaggio deve comparire solo quando l'utente e' davvero autenticato e non admin, non durante il caricamento della sessione o della overview.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Durante il refresh della sessione (auth.loading) non compare ne' il messaggio di login ne' quello di non-admin, ma un testo di caricamento neutro
- [ ] #2 Per un utente admin con overview in corso di caricamento non compare piu' il messaggio 'non amministratore'
- [ ] #3 Per un utente autenticato ma realmente non nel gruppo admins il messaggio adminPending resta mostrato
- [ ] #4 Nessuna modifica alla logica di autenticazione o alle chiamate API
<!-- AC:END -->
