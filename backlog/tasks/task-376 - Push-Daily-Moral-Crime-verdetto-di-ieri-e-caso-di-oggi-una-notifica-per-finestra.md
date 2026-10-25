---
id: TASK-376
title: >-
  Push Daily Moral Crime: verdetto di ieri e caso di oggi, una notifica per
  finestra
status: In Progress
assignee: []
created_date: '2026-10-25 14:44'
updated_date: '2026-10-25 15:00'
labels:
  - growth
  - retention
  - notifications
  - daily
dependencies:
  - TASK-275
priority: high
ordinal: 277000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Una sola notifica per persona per finestra Daily (rilascio 09:00 UTC), mandata al primo giro orario dopo il rilascio in cui l'ora locale e' tra le 9 e le 21. Se ha votato ieri e il campione e' sufficiente: verdetto reale ('eri con il 62%') piu' il caso nuovo; altrimenti solo il caso nuovo. Opt-in dopo il voto sulla schermata Daily. Job orario Lambda pianificato con EventBridge Scheduler (Free Tier verificato 2026-10-25: 14M invocazioni/mese gratuite; Lambda 1M richieste e 400k GB-s).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Un job orario pianificato (EventBridge Scheduler + Lambda con ruolo a privilegi minimi) invia al massimo una notifica per sottoscrizione per finestra Daily, in modo idempotente (nessun doppio invio se il job si ripete)
- [x] #2 Nessun invio fuori dalle 9-21 ora locale della sottoscrizione; senza fuso noto si usa UTC
- [x] #3 Il verdetto compare solo se la persona ha votato nella finestra precedente e i voti totali sono almeno 5; non vengono mai mostrati numeri inventati
- [x] #4 Prompt di iscrizione sulla schermata Daily dopo il voto; push_notification_opened e reset del contatore all'apertura di /daily con utm_source=push
- [x] #5 Verificato costo: nessuna risorsa fuori Free Tier; ADR con la verifica dei prezzi; test backend, lint e build passano
- [ ] #6 Prima esecuzione reale del job in produzione verificata nei log (schedule creato dal deploy, nessun errore, consegna e apertura viste nella card Duel notifications)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-25: implementato (ADR-162). Lambda push-digest con ruolo dedicato + aws_scheduler_schedule rate(1 hour); terraform validate/fmt puliti in copia isolata (nessun apply locale). Free Tier verificato sulle pagine ufficiali (Scheduler 14M invocazioni/mese, Lambda 1M richieste e 400k GB-s). Aggiunto: chi ha gia' votato oggi viene saltato. L'AC finale resta aperta fino alla prima esecuzione reale.
<!-- SECTION:NOTES:END -->
