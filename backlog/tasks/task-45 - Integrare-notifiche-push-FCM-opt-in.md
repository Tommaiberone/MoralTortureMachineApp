---
id: TASK-45
title: Integrare notifiche push FCM opt-in
status: To Do
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-09-07 08:28'
labels:
  - m5-retention
  - android
  - notifications
  - analytics
dependencies:
  - TASK-43
  - TASK-274
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Chiedere permesso solo dopo valore dimostrato e misurare delivery, open, completion e opt-out. Valutare il rebuild APK prima dell'implementazione.

Rescope 2026-09-07: canale nativo Android via @capacitor/push-notifications + Firebase Cloud Messaging, controparte di TASK-275 (Web Push/PWA, stesso trigger su Moral Duel). Dipende da TASK-274 per lo schema di subscription/invio condiviso invece di costruire un proprio storage separato. Il deferral del 2026-08-10 ('reassess only after measured organic Daily return') e' superato: TASK-273 ha misurato che il segnale piu' forte non e' su Daily (quasi nessun primo contatto, campione troppo piccolo) ma sul Moral Duel (D1 11,4% vs D7 0%), motivo per cui questo e TASK-275 partono ora invece di aspettare Daily.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Permesso non è richiesto al primo avvio
- [ ] #2 Utente può fare opt-out facilmente
- [ ] #3 Metriche push sono privacy-safe
- [ ] #4 Stesso trigger iniziale di TASK-275: notifica quando l'altro partecipante di un Moral Duel risponde o completa la sua parte, instradata tramite la funzione di invio di TASK-274, non un digest/reminder ricorrente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-10: User explicitly deferred push notifications from the initial Daily release. Keep this task in Backlog; reassess only after measured organic Daily return.
<!-- SECTION:NOTES:END -->
