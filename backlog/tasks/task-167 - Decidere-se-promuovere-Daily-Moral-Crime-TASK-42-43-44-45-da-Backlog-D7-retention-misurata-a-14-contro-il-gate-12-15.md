---
id: TASK-167
title: >-
  Decidere se promuovere Daily Moral Crime (TASK-42/43/44/45) da Backlog: D7
  retention misurata a 1,4% contro il gate 12-15%
status: Backlog
assignee: []
created_date: '2026-08-05 15:52'
updated_date: '2026-08-05 16:04'
labels:
  - growth
  - analytics
  - decision
  - product
dependencies:
  - TASK-166
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sei un product strategist che tratta i gate di doc-2 come vincoli duri, non come suggerimenti: se un gate fallisce in modo netto, il default e' fermarsi e far decidere l'utente, non continuare a costruire altrove sperando che si sistemi da solo. Il 2026-08-05, da uno scan diretto delle tabelle DynamoDB prod (nessuno strumento nativo ancora, vedi TASK-41), la D7 retention e' stata misurata cosi': su una coorte di 429 identita' viste per la prima volta tra il 2026-07-15 e il 2026-07-29, solo 6 (1,4%) sono tornate in un giorno qualsiasi successivo, e 0 sono tornate nella finestra day+5..+9. Il gate di doc-2 e' 12-15% prima di attivare acquisizione a pagamento, e doc-2 dice esplicitamente di non scalare la paid acquisition finche' i loop di referral e retention non sono misurati, e di non lanciare una subscription finche' il prodotto non dimostra valore ricorrente settimanale. La delivery sequence di doc-2 mette Retention through a daily dilemma subito dopo Party Room, che e' gia' shippato, ma TASK-42/43/44 (Daily Moral Crime: definizione, voto/reveal/streak, social loop) e TASK-45 (notifiche push FCM opt-in) sono ancora fermi in Backlog senza priorita' assegnata. Questa e' una decisione di prodotto che spetta esplicitamente all'utente: non promuovere questi task da solo e non iniziare a implementarli. Il tuo compito e' presentare la scelta con i numeri sopra, ottenere una risposta esplicita, e registrarla.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'utente ha scelto esplicitamente una tra: (a) promuovere TASK-42/43/44/45 a To Do ora, (b) rimandare la decisione al prossimo check growth insieme a TASK-166, (c) accettare il gate fallito per ora e proseguire su altri task pianificati
- [x] #2 La decisione e la sua motivazione sono registrate come voce ADR in decision-1
- [ ] #3 Se scelta l'opzione (a), TASK-42/43/44/45 vengono effettivamente spostati a To Do con backlog task edit e con priorita' coerente rispetto al resto del To Do
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisione presa 2026-08-05 (in conversazione con l'utente): rimandata al prossimo check growth del 2026-08-19, insieme a TASK-166. Vedi ADR-070 in decision-1 per contesto completo e motivazione. TASK-42/43/44/45 restano in Backlog senza priorita' fino ad allora.
<!-- SECTION:NOTES:END -->
