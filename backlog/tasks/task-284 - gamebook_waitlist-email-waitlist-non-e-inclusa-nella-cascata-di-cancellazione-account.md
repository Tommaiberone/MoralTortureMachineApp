---
id: TASK-284
title: >-
  gamebook_waitlist (email waitlist) non e' inclusa nella cascata di
  cancellazione account
status: Backlog
assignee: []
created_date: '2026-09-08 14:43'
labels: []
dependencies: []
priority: low
type: task
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-281 salva l'iscrizione Early Bird alla waitlist del gamebook fisico nella nuova tabella gamebook_waitlist (chiave hash = email, piu' anonymousUserId di riferimento). Come per push_subscriptions (TASK-274), questa tabella non e' inclusa in _collect_account_data/_delete_linked_account_data ne' nella scansione della retention_sweep Lambda: DELETE /users/me e la sweep annuale non rimuovono l'email di un utente che aveva aderito alla waitlist da anonimo e poi cancella l'account autenticato. Volume atteso basso (smoke test di validazione domanda), ma CLAUDE.md richiede esplicitamente che la cancellazione account rimuova i dati utente associati salvo eccezioni documentate per obblighi legali/fraud/finanziari, e qui non c'e' un'eccezione documentata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Si decide se gamebook_waitlist deve essere inclusa nella cascata di export/cancellazione per anonymousUserId, oppure se va documentata un'eccezione esplicita (motivo: outreach della campagna, con una scadenza/TTL ragionevole)
- [ ] #2 La stessa domanda viene posta esplicitamente anche per push_subscriptions, che condivide lo stesso gap
- [ ] #3 doc-1 e/o il log ADR riflettono la decisione presa
<!-- AC:END -->
