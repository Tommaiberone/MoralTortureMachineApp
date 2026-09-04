---
id: TASK-266
title: >-
  Decidere direzione: redesign visivo di /account da sloggato, e idea mascotte
  app-wide 'che ti spia'
status: Open Points
assignee: []
created_date: '2026-09-04 18:55'
labels:
  - design
  - ux
  - open-decision
dependencies: []
priority: medium
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha chiesto un parere: /account da sloggato resta visivamente scarna (titolo piccolo e dimesso in .account-page-title, una singola card bordata con due righe di testo e un bottone - vedi AccountDeleteScreen.css .account-page-title/.account-login-card) anche dopo il fix di copy in TASK-265; per contro la card archetipo per utenti loggati (.account-archetype-card) ha gia' un trattamento piu' curato (bordo colorato, emoji, ombra). L'utente ha anche proposto, come idea aperta, una mascotte ricorrente in tutta l'app - un personaggio 'che ti spia', coerente col tema horror/moral-torture del prodotto - senza ancora indicare dove dovrebbe comparire ne' se e' uno scherzo o una direzione seria da perseguire. Nessuna delle due cose e' stata implementata: sono scelte di direzione visiva/prodotto trasversali che meritano conferma esplicita prima di investire in asset e codice, non fix puntuali.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utente conferma se vuole procedere con un redesign della card /account da sloggato (e con quale riferimento visivo, es. mirror di .account-archetype-card)
- [ ] #2 Utente conferma se la mascotte e' una direzione da sviluppare seriamente, e se si' dove compare per prima (homepage? risultati? loading state?) prima di produrre asset
<!-- AC:END -->
