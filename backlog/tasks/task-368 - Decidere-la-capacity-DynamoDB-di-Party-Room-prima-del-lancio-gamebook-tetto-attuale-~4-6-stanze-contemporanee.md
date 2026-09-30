---
id: TASK-368
title: >-
  Decidere la capacity DynamoDB di Party Room prima del lancio gamebook (tetto
  attuale ~4-6 stanze contemporanee)
status: Open Points
assignee: []
created_date: '2026-09-30 13:34'
labels:
  - party-room
  - cost
  - aws
  - database
  - gamebook
dependencies: []
priority: high
ordinal: 269000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Stima 2026-09-30 su dati reali. party_rooms e party_participants sono PROVISIONED 5/5 (Free Tier). Ogni partecipante fa polling ogni 1,5s in votazione e ogni 3s in lobby/reveal (PartyRoomScreen.jsx). Misurato su due sessioni reali (22/09 ~5-6 giocatori, 24/09 ~2-4): 0,14-0,22 RCU per richiesta su party_rooms, 0,24-0,30 su party_participants; in media ~0,14 RCU/s per giocatore sulla tabella participants, ~0,3 nel minuto di picco. Tetto sostenuto: 5 RCU/s, cioe' circa 15-35 giocatori contemporanei in tutto, circa 4-6 stanze da 5; oltre, ProvisionedThroughputExceededException, poi retry lenti e 500 (lo stesso quadro di TASK-191). Il burst bank (~300s di capacita' non usata, fino a ~1500 RCU) copre solo picchi di pochi minuti. In lobby/reveal/finale ogni poll rilegge l'intero roster (Query), quindi il costo per stanza cresce col quadrato dei partecipanti: una sola stanza piena da 20 puo' superare da sola 5 RCU/s in quelle fasi. Lambda (1000 di concorrenza) e API Gateway (nessun throttle custom) sono molto lontani dal limite. Rilevanza: i QR del gamebook aprono capitoli in modalita' party (_load_gamebook_chapters), e il lancio di Natale (ADR-153) puo' concentrare molte famiglie nella stessa sera. Opzioni: (a) PAY_PER_REQUEST sulle due tabelle, nessun tetto e costo stimato in centesimi anche con centinaia di giocatori per ora (le letture on-demand costano ~0,25-0,28 USD per milione, e a quel punto il costo dominante diventa API Gateway, ~1,11 USD per milione di richieste); e' la leva che ADR-118 ha lasciato esplicitamente in attesa di approvazione dei costi. (b) Alzare la capacity provisioned oltre il Free Tier (costo fisso orario). (c) Ridurre il costo per poll (roster con versione/contatore invece di Query completa, intervalli adattivi). (d) Prima eseguire TASK-49 (load test 2-20 partecipanti, oggi in Backlog).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 L'utente sceglie un'opzione (o una combinazione) con costo atteso esplicito
- [ ] #2 Se viene scelto on-demand: eccezione Free Tier registrata in ADR e doc-1 con budget guardrail e kill switch, come richiede CLAUDE.md
- [ ] #3 La scelta e' applicata e verificata prima della milestone M4 del gamebook (16 novembre)
<!-- AC:END -->
