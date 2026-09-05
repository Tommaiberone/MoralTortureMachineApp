---
id: TASK-258
title: >-
  Il testo account.deleteScope (cosa viene cancellato) e' scritto ma mai
  renderizzato nel dialogo di conferma cancellazione account
status: Done
assignee: []
created_date: '2026-09-04 15:03'
updated_date: '2026-09-05 21:40'
labels:
  - frontend
  - copy
  - ux
dependencies: []
priority: medium
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente frontend growth/account): frontend/public/locales/en.json riga 358, la chiave account.deleteScope contiene una frase completa gia' scritta e approvata che spiega esattamente cosa rimuove la cancellazione ('Deletion removes your Cognito account, claimed linked profiles, raw analytics, and shared Duel/Party objects...'), ma grep conferma zero chiamate a t('account.deleteScope') in tutto il codice. Il dialogo di conferma reale in AccountDeleteScreen.jsx:260-272 mostra solo il generico deleteConfirmPrompt. E' una feature a meta': copy informativa gia' pronta per un'azione irreversibile, mai collegata alla UI - un'azione di cancellazione account merita il contesto completo prima della conferma.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 account.deleteScope (o testo equivalente aggiornato se lo scope di cancellazione e' cambiato da quando e' stato scritto) e' visibile nel dialogo/schermata di conferma prima che l'utente confermi la cancellazione
<!-- AC:END -->
