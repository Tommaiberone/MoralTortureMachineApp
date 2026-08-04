---
id: TASK-14
title: Aggiungere login progressivo dopo il primo risultato
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-04 10:56'
labels:
  - m1-auth
  - auth
  - frontend
  - growth
dependencies:
  - TASK-135
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mostrare il login solo in cambio di valore concreto e immediato, non di una promessa astratta ('salva per sempre'). Il momento giusto e' il picco emotivo del prodotto: subito dopo il confronto Duel (ChallengeCompareScreen), non dopo il risultato solista. Il gancio concreto e' lo sblocco dell'insight AI di coppia (TASK-135): il prompt spiega esattamente cosa si ottiene autenticandosi, non un generico 'accedi'. Il primo test e la prima challenge restano sempre anonimi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il primo test e l'ingresso alla prima challenge restano anonimi
- [x] #2 Il prompt di login compare su ChallengeCompareScreen dopo il confronto, con copy legata allo sblocco dell'insight AI di coppia (TASK-135), non a un salvataggio generico
- [x] #3 Il prompt resta dismissibile: l'utente puo' continuare a usare il prodotto in forma anonima se lo ignora
- [x] #4 Esposizione, avvio, completamento e annullamento del prompt sono tutti misurati in analytics
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato su ChallengeCompareScreen.jsx: box compare-insight (se pairInsightUnlocked) o compare-login-cta con testo/bottone legati specificamente allo sblocco dell'insight AI di coppia (TASK-135), non a un salvataggio generico. Non e' un modale/blocco: resta un box informativo dismissibile, il resto della pagina (confronto, rematch, share) funziona comunque. Eventi auth_prompt_shown/auth_prompt_clicked tracciati per questa superficie; completamento/annullamento gia' coperti dagli eventi esistenti auth_completed/auth_failed in authClient.js. Primo test e prima challenge non toccati, restano anonimi.
<!-- SECTION:NOTES:END -->
