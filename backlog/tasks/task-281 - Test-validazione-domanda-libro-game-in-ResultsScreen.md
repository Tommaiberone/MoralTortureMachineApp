---
id: TASK-281
title: Test validazione domanda libro-game in ResultsScreen
status: Done
assignee: []
created_date: '2026-09-08 14:28'
updated_date: '2026-09-08 14:46'
labels: []
dependencies: []
priority: medium
type: feature
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere uno smoke test/lead capture in ResultsScreen per validare l'interesse degli utenti verso un libro-game fisico basato sui dilemmi morali prima di avviare la produzione o la campagna Kickstarter. Il componente propone l'iscrizione alla lista d'attesa Early Bird con il proprio indirizzo email.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 In ResultsScreen viene renderizzato un box/card 'Classified Dossier: The Gamebook' a tema horror/dossier sotto la sezione archetipo
- [x] #2 Include un campo email con validazione formato e bottone CTA 'Notify Me / Early Access'
- [x] #3 Traccia l'evento analytics gamebook_teaser_viewed al render visibile del componente
- [x] #4 Al submit valida l'email, invia l'evento analytics gamebook_waitlist_signup e salva l'iscrizione
- [x] #5 Mostra un messaggio di conferma post-iscrizione elegante e disabilita il reinvio
- [x] #6 Tutti i testi sono internazionalizzati tramite i18next
<!-- AC:END -->
