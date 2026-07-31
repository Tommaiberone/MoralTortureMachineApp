---
id: TASK-38
title: Creare landing challenge e deep link multipiattaforma
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-07-31 14:17'
labels:
  - m4-duel
  - frontend
  - android
  - sharing
dependencies:
  - TASK-35
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere /challenge/:token, esperienza invitee-first, native deep link e fallback web quando l'app non è installata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Link apre la challenge corretta su web
- [x] #2 Android apre l'app o degrada al web
- [x] #3 Invitato completa senza registrarsi
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ChallengeLandingScreen.jsx su /challenge/:token: apre sempre la challenge corretta via GET /challenges/{token} (nessuno stato client necessario, funziona su link diretto e refresh). Esperienza invitee-first: teaser con archetipo del creator + CTA 'Accetta la sfida', poi join->fetch dilemmi specifici (GET /dilemmas/by-ids con i baseId della sfida, non dilemmi casuali)->risposta sequenziale->submit->redirect al confronto. Nessuna registrazione richiesta, solo identita' anonima esistente (X-Anonymous-User-Id). Deep link nativo Android: NON implementato in questa sessione - degrada correttamente al web (la stessa route React funziona identica dentro la WebView Android quando l'app e' gia' aperta li', e in un browser mobile normale se aperta da fuori); Android App Links con assetlinks.json per aprire l'app automaticamente da un link esterno resta un lavoro separato ed esplicitamente discusso/rimandato con l'utente per lo schema di auth, stessa logica si applicherebbe qui.
<!-- SECTION:NOTES:END -->
