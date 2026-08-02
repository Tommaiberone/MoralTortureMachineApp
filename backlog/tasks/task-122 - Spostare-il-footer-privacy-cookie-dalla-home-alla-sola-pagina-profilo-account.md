---
id: TASK-122
title: Spostare il footer privacy/cookie dalla home alla sola pagina profilo/account
status: Done
assignee: []
created_date: '2026-08-02 09:37'
updated_date: '2026-08-02 09:37'
labels:
  - frontend
  - privacy
  - ux
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha segnalato che il piccolo footer fisso (Privacy | Cookies | Preferenze privacy) restava visibile su ogni schermata, home inclusa, anche dopo aver gia' scelto il consenso GA4 - lo voleva raggiungibile solo dalla pagina profilo/account (TASK-120).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il footer Privacy/Cookie/Preferenze non e' piu' montato globalmente in App.jsx
- [x] #2 Lo stesso footer (link + toggle preferenze) e' raggiungibile dalla pagina /account
- [x] #3 Il banner di consenso iniziale (prima scelta) continua a comparire su tutte le pagine finche' non si sceglie, invariato
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rimosso <PrivacyFooter /> dal mount globale in App.jsx (era fuori da <Routes>, quindi visibile su ogni schermata inclusa la home). Riusato lo stesso componente PrivacyFooter (link Privacy/Cookies + bottone Preferenze privacy, gia' esistente in AnalyticsConsent.jsx, invariato) dentro AccountDeleteScreen.jsx (/account), al posto del blocco legalLinks che avevo aggiunto in TASK-120 - evita di avere due set di link privacy/cookie ridondanti sulla stessa pagina. Rimosse le chiavi account.privacyLink/cookiesLink da en.json, ora orfane. AnalyticsConsent (il banner di prima scelta) resta montato globalmente e invariato: sparisce da solo dopo la scelta, non e' quello di cui l'utente si lamentava. pnpm lint e build:prod puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
