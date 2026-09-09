---
id: TASK-296
title: Floating banner nella homepage per il gamebook in uscita
status: Done
assignee: []
created_date: '2026-09-09 15:03'
updated_date: '2026-09-09 15:10'
labels: []
dependencies: []
priority: medium
type: feature
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere un banner fluttuante (dismissibile) nella HomeScreen che pubblicizza il gamebook fisico in uscita, riusando il meccanismo di waitlist gia' esistente in ResultsScreen (TASK-281, box 'Classified Dossier: The Gamebook' con signup email). Estrarre la logica condivisa (validazione email, submit a POST /gamebook-waitlist, flag localStorage 'gia' iscritto', tracking analytics) in un componente/hook riusabile invece di duplicarla, e renderizzarlo sia in ResultsScreen (variante card esistente) sia in HomeScreen (nuova variante banner fluttuante, posizione fissa, chiudibile con X, dismissal persistito per non essere invasivo ad ogni visita).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sulla HomeScreen compare un banner fluttuante a tema horror/dossier che pubblicizza il gamebook fisico, senza ostacolare i CTA di gioco esistenti
- [x] #2 Il banner e' dismissibile con una X e la chiusura viene ricordata (non ricompare ad ogni reload nella stessa sessione/dispositivo)
- [x] #3 Il banner riusa la stessa validazione email, chiamata POST /gamebook-waitlist e logica 'gia' iscritto' di ResultsScreen tramite un componente/hook condiviso, non una riscrittura duplicata
- [x] #4 Traccia gamebook_teaser_viewed e gamebook_waitlist_signup con una proprieta' surface che distingue home da results
- [x] #5 Tutti i testi sono internazionalizzati tramite i18next (chiavi en.json, come da eccezione it.json drift)
- [x] #6 pnpm lint e pnpm build:prod passano
<!-- AC:END -->
