---
id: TASK-378
title: 'A/B/C test: copy del prompt di iscrizione alle notifiche del Daily'
status: Done
assignee: []
created_date: '2026-10-28 19:35'
updated_date: '2026-10-28 19:38'
labels:
  - growth
  - retention
  - notifications
  - experiment
dependencies:
  - TASK-376
priority: medium
ordinal: 279000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tre versioni del testo del prompt che compare dopo il voto al Daily Moral Crime: 'utility' (attuale: verdetto e caso di domani, max una al giorno), 'curiosity' (ti diremo se eri con la maggioranza) e 'brief' (una riga). Stessa meccanica degli altri esperimenti di copy (bucketing deterministico per anonymous_user_id, esposizione push_prompt_shown con variant, conversione push_subscribed, tabella copyExperiments della dashboard). Attenzione al campione: ~15 esposizioni a settimana, quindi il test non puo' concludere per mesi; non toccare il codice per dichiarare un vincitore prima di |z| >= 1,96 con campione sufficiente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il prompt del Daily mostra una di tre varianti scelta in modo deterministico per anonymous_user_id; la variante e' una proprieta' di push_prompt_shown
- [x] #2 Il backend aggrega esposti e convertiti per variante (pushDailyPromptCopy) in entrambi i percorsi (Scan e aggregati) e la dashboard li mostra senza lavoro aggiuntivo
- [x] #3 Il prompt del Duel e le altre superfici non cambiano; nuove chiavi solo in en.json; test backend, pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-28: implementato (ADR-163). Il test restera' acceso: ~15 esposizioni a settimana, servono circa 100 persone per variante (~20 settimane) per un 14%->30%. Nessun vincitore va dichiarato prima di |z|>=1,96 con campione sufficiente (regola TASK-223).
<!-- SECTION:NOTES:END -->
