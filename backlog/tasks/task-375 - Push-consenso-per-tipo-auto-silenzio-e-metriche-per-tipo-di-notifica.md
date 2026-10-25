---
id: TASK-375
title: 'Push: consenso per tipo, auto-silenzio e metriche per tipo di notifica'
status: Done
assignee: []
created_date: '2026-10-25 14:44'
updated_date: '2026-10-25 15:00'
labels:
  - growth
  - retention
  - notifications
dependencies:
  - TASK-275
priority: high
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Base comune per le notifiche push oltre al Duel completato (TASK-275). Ogni iscrizione ha un insieme di topic (duel, daily) invece di un consenso unico; chi ignora 3 notifiche di fila di un topic viene spento da solo su quel topic; l'apertura da push azzera il contatore; la dashboard separa consegnate/aperte per tipo (trigger). Righe separate per topic nelle impostazioni /account. Nasce da ADR-160/161: D7 all'1% e richiesta di notifiche non invadenti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'iscrizione web push salva un insieme di topic e l'iscrizione a un nuovo topic aggiunge senza cancellare i topic gia' attivi; le righe vecchie senza topic valgono 'duel'
- [x] #2 POST /push/unsubscribe con topic toglie solo quel topic e cancella la riga solo quando non ne restano; il browser si disiscrive solo quando non restano topic
- [x] #3 Dopo 3 invii consecutivi non aperti su un topic, quel topic viene spento su quel dispositivo e l'evento push_topic_auto_silenced viene tracciato; POST /push/opened (da utm_source=push) e il voto Daily azzerano il contatore
- [x] #4 La dashboard mostra consegnate e aperte per tipo di notifica (trigger) con tasso di apertura
- [x] #5 Impostazioni /account: una riga on/off per topic; nuove chiavi solo in en.json; test backend, pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-25: implementato (ADR-162). Topic duel/daily su ogni registrazione, auto-silenzio dopo 3 invii non aperti (reset con apertura o voto Daily), POST /push/status e /push/opened, byTrigger in dashboard, righe per topic in /account. Bug trovato e corretto nello stesso cambio: gli eventi di consegna attribuiti al destinatario (ADR-161) contavano come attivita' e avrebbero gonfiato D1/D7; ora serverInitiated li esclude (test dedicato). 309 test backend, lint e build passano.
<!-- SECTION:NOTES:END -->
