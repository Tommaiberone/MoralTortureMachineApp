---
id: TASK-275
title: >-
  Web Push (PWA): service worker, opt-in dopo valore dimostrato, primo trigger
  su Moral Duel
status: To Do
assignee: []
created_date: '2026-09-07 08:28'
labels:
  - growth
  - retention
  - notifications
  - frontend
  - pwa
dependencies:
  - TASK-274
documentation:
  - backlog/docs/doc-2
priority: high
type: feature
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Canale Web Push per la PWA (browser desktop e Android; su iOS Safari funziona solo se l'utente ha installato la PWA in Home Screen su iOS 16.4+, altrimenti nessun push e' possibile - limite della piattaforma, non nostro). Stima diretta sugli user-agent web delle ultime 30gg: iOS ~38%, Android browser ~29%, Desktop ~16% delle identita' web - quindi anche solo Android browser+Desktop coprono una quota rilevante senza bisogno di installazione.

Oggi il frontend non ha alcun service worker (solo il manifest esiste, sufficiente per 'Aggiungi a Home' ma non per il push). Dipende da TASK-274 per lo schema di subscription e la funzione di invio.

Primo trigger da costruire, non un digest generico: sul Moral Duel, dove TASK-273 ha misurato D1 alto (11,4%) e D7 a zero (0/93) - notificare quando l'avversario risponde o completa, non un reminder ricorrente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Service worker registrato (nuovo), gestisce l'evento push e il click sulla notifica (deep link alla schermata Duel/Compare pertinente)
- [ ] #2 Permesso di notifica NON richiesto al primo avvio; richiesto solo dopo un momento di valore dimostrato nel flusso Duel (es. dopo aver creato/aperto una sfida), coerente con l'AC#1 gia' definito per TASK-45
- [ ] #3 Su iOS Safari non installato in Home Screen, nessun prompt di permesso viene mostrato (rilevare lo stato standalone/installato prima di chiedere); nessun errore visibile per l'utente non idoneo
- [ ] #4 Trigger iniziale unico: notifica quando l'altro partecipante di un Moral Duel risponde o completa la sua parte, instradata tramite la funzione di invio di TASK-274
- [ ] #5 Opt-out facile e persistente (stessa superficie account/impostazioni delle altre preferenze utente)
- [ ] #6 Nuove chiavi i18n solo in en.json (it.json drift exception); pnpm lint e pnpm build:prod passano
<!-- AC:END -->
