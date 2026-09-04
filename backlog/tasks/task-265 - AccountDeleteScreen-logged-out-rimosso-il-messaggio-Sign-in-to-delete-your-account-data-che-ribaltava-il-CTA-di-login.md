---
id: TASK-265
title: >-
  AccountDeleteScreen (logged-out): rimosso il messaggio 'Sign in to delete your
  account data' che ribaltava il CTA di login
status: Done
assignee: []
created_date: '2026-09-04 18:54'
updated_date: '2026-09-04 18:54'
labels:
  - bug
  - copy
  - ux
dependencies: []
priority: medium
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha segnalato che /account da sloggato e' 'inutilmente tecnica e scarna'. Causa concreta trovata: subito sotto la frase-beneficio (account.notLoggedInBenefits, 'Signing in keeps your results...'), la card mostrava una seconda riga - account.notLoggedIn, 'Sign in to delete your account data.' - un residuo del componente quando era solo il flusso di cancellazione account (nome file AccountDeleteScreen.jsx), mai aggiornato quando TASK-177 lo ha trasformato nell'hub account generale. Il risultato era che il motivo di login piu' visibile per un visitatore era 'per cancellare i tuoi dati', l'esatto opposto di un CTA invitante. Fix: rimossa la riga da AccountDeleteScreen.jsx e la chiave account.notLoggedIn ora orfana da en.json (nessun altro chiamante).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AccountDeleteScreen.jsx: la card not-logged-in mostra solo il beneficio + bottone Sign in, non piu' la riga sulla cancellazione account
- [x] #2 account.notLoggedIn rimossa da en.json (era l'unico chiamante)
- [x] #3 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fix di copy minimale e mirato. Il resto del feedback dell'utente (trattamento visivo scarno della card, idea di una mascotte 'che ti spia' in giro per l'app) e' una decisione di design piu' ampia, tracciata separatamente e non implementata qui senza conferma.
<!-- SECTION:FINAL_SUMMARY:END -->
