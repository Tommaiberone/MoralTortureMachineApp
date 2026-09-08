---
id: TASK-282
title: >-
  DynamoDB provisioned capacity ha raggiunto il tetto Free Tier 25/25 RCU-WCU
  dopo TASK-281
status: Open Points
assignee: []
created_date: '2026-09-08 14:43'
labels: []
dependencies: []
priority: high
type: task
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-281 ha aggiunto la tabella gamebook_waitlist (PROVISIONED 1/1 RCU/WCU). Sommando tutte le tabelle PROVISIONED attuali in backend/terraform/main.tf (users, moral_profiles+GSI, challenges, challenge_participants+GSI, party_rooms, party_participants, daily_moral_crime_votes+GSI, push_subscriptions, gamebook_waitlist, ops_error_alerts) il totale e' esattamente 25 RCU e 25 WCU, cioe' l'intero DynamoDB Free Tier condiviso dall'account (dilemmas/user_analytics/product_events restano PAY_PER_REQUEST e non contano in questo totale). Non c'e' piu' margine: la prossima tabella o GSI provisioned che chiede anche solo 1 RCU/WCU aggiuntivo sforera' il Free Tier e iniziera' a generare costo, salvo passare esplicitamente per l'eccezione documentata in CLAUDE.md (costo atteso, alternative gratuite, guardrail di budget, approvazione esplicita).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Il totale RCU e WCU provisioned attuale e' verificato via AWS Cost Explorer/console, non solo sommando il codice Terraform
- [ ] #2 Viene decisa una strategia per la prossima tabella/GSI provisioned che serva capacita' aggiuntiva: ridurre la capacita' di una tabella a basso traffico, migrare qualcosa a on-demand, o accettare esplicitamente un'eccezione a pagamento con budget guardrail
- [ ] #3 doc-1 viene aggiornato con la strategia scelta
<!-- AC:END -->
