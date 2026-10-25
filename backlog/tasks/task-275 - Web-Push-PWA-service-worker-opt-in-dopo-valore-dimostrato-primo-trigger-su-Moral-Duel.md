---
id: TASK-275
title: >-
  Web Push (PWA): service worker, opt-in dopo valore dimostrato, primo trigger
  su Moral Duel
status: In Progress
assignee: []
created_date: '2026-09-07 08:28'
updated_date: '2026-10-25 15:01'
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
- [x] #1 Service worker registrato (nuovo), gestisce l'evento push e il click sulla notifica (deep link alla schermata Duel/Compare pertinente)
- [x] #2 Permesso di notifica NON richiesto al primo avvio; richiesto solo dopo un momento di valore dimostrato nel flusso Duel (es. dopo aver creato/aperto una sfida), coerente con l'AC#1 gia' definito per TASK-45
- [x] #3 Su iOS Safari non installato in Home Screen, nessun prompt di permesso viene mostrato (rilevare lo stato standalone/installato prima di chiedere); nessun errore visibile per l'utente non idoneo
- [x] #4 Trigger iniziale unico: notifica quando l'altro partecipante di un Moral Duel risponde o completa la sua parte, instradata tramite la funzione di invio di TASK-274
- [x] #5 Opt-out facile e persistente (stessa superficie account/impostazioni delle altre preferenze utente)
- [x] #6 Nuove chiavi i18n solo in en.json (it.json drift exception); pnpm lint e pnpm build:prod passano
- [x] #7 Dashboard admin mostra il funnel push per persona (prompt, iscritto, consegnato, aperto) piu' opt-out e fallimenti
- [ ] #8 Verifica end-to-end reale su un browser: il creator si iscrive, un invitato completa, la notifica arriva e il click apre il confronto (da fare dall'utente, nessuna automazione browser nel repo)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dato a supporto (2026-09-30, storia completa): dei 190 votanti del Daily Moral Crime, 173 hanno votato un solo giorno; solo 14 su 154 idonei sono tornati a votare entro 7 giorni dal primo voto. Il Daily, pensato come abitudine quotidiana, oggi non richiama nessuno senza un promemoria: e' il caso d'uso piu' diretto per il push, insieme al trigger Duel gia' previsto.

2026-10-24: implementato. Backend: _notify_duel_creator_completed in submit_challenge (unico trigger, best-effort), eventi push attribuiti al destinatario, sezione pushNotifications negli aggregati write-time e in /admin/analytics (scheda Moral Duel). Frontend: public/sw.js, utils/webPush.js, components/PushOptIn.jsx (prompt dopo la creazione della sfida + riga impostazioni in /account), push_notification_opened su ChallengeCompareScreen via utm_source=push. Chiave VAPID verificata viva in prod. 285 test backend, pnpm lint e pnpm build:prod passano; nessun controllo in browser reale (regola repo). Nessun bump APK: UI nascosta nell'app Capacitor, backend retrocompatibile. AC #8 resta aperto finche' non c'e' una consegna reale. Vedi ADR-161.

2026-10-25: estesa da TASK-375/376/377 (altre notifiche, consenso per topic). AC #8 invariata: serve ancora la prima consegna reale del Duel completato.
<!-- SECTION:NOTES:END -->
