---
id: TASK-120
title: Aggiungere pagina profilo/account raggiungibile da icona tonda in homepage
status: Done
assignee: []
created_date: '2026-08-02 08:14'
updated_date: '2026-08-02 08:17'
labels:
  - frontend
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha chiesto una pagina 'il mio profilo', raggiungibile dalla homepage tramite un'icona tonda in alto a destra, che contenga almeno il link alla Privacy Policy. Non deve essere presente su tutte le schermate (solo in homepage). AccountDeleteScreen.jsx (/delete-account) gia' mostra lo stato di login/logout, export dati ed eliminazione account (TASK-15) sotto il titolo 'Your account': e' gia' concettualmente la pagina profilo/account, solo mai stata resa raggiungibile dall'interfaccia (ADR-028 la voleva deliberatamente unlinked). Piano: aggiungere i link a Privacy Policy e Cookie Policy nella stessa schermata, esporla anche su una route piu' pertinente /account (in aggiunta a /delete-account, senza rimuoverla), e aggiungere un piccolo bottone rotondo in alto a destra solo su HomeScreen che porta a /account.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un'icona rotonda in alto a destra della sola homepage porta a una pagina profilo/account
- [x] #2 L'icona e la pagina non sono presenti nelle altre schermate (tutorial, evaluation, results, ecc.)
- [x] #3 La pagina profilo contiene un link funzionante alla Privacy Policy
- [x] #4 Il flusso di login/logout/export/delete account esistente (TASK-15) continua a funzionare invariato, incluso l'URL /delete-account gia' esistente
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta icona rotonda in alto a destra, solo su HomeScreen.jsx (con trackEvent profile_icon_clicked), che porta a una nuova route /account. /account e /delete-account renderizzano lo stesso AccountDeleteScreen.jsx (gia' mostrava login/logout/export/delete sotto 'Your account', TASK-15), a cui sono stati aggiunti i link a Privacy Policy e Cookie Policy in tutti e tre i rami di rendering (loading escluso). Nessuna duplicazione: riusato il componente esistente invece di crearne uno nuovo. Aggiunte le chiavi home.profile_icon_label e account.privacyLink/cookiesLink in en.json e it.json (l'app resta forzata in EN per TASK-101, ma le chiavi IT sono gia' pronte per quando verra' riattivato). pnpm lint e build:prod puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
