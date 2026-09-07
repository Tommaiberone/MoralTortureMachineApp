---
id: TASK-276
title: >-
  Aggiungere un controllo automatico contro caratteri non validi nei tag value
  DynamoDB prima del deploy
status: Backlog
assignee: []
created_date: '2026-09-07 09:04'
labels:
  - infra
  - deploy
  - tech-debt
dependencies: []
references:
  - backlog/decisions/decision-1 - ADR-Log.md
documentation:
  - backend/terraform/main.tf
priority: medium
type: chore
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
DynamoDB CreateTable rifiuta i tag value con parentesi o virgole (il set di caratteri ammesso lato API AWS e' piu' stretto di quanto terraform validate controlli - il problema e' sempre e solo lato API, mai lato schema Terraform). Lo stesso identico errore ha gia' rotto il deploy 4 volte: party_rooms/Duel il 2026-08-02 (ADR-055), ops_error_alerts il 2026-08-04 (TASK-137), e push_subscriptions il 2026-09-07 (TASK-274). Ogni volta e' stato corretto a mano dopo che il deploy falliva in produzione, mai prevenuto in anticipo - la documentazione da sola (ADR, task chiusi) non ha impedito la ricorrenza perche' nessuno la rilegge tag-per-tag scrivendo una nuova tabella.

Serve un controllo automatico, non un altro promemoria testuale: uno script Python/regex che scansiona backend/terraform/main.tf (e frontend/terraform se rilevante) cercando ogni blocco tags/Purpose e verifica che i value rispettino il set di caratteri effettivamente ammesso da AWS per i tag DynamoDB (lettere, numeri, spazi, e ' _ . : / = + - @ ' - verificare il pattern esatto dalla documentazione AWS corrente prima di implementare, non fidarsi a memoria). Va eseguito prima del terraform apply, idealmente come step CI dedicato in deploy.yml (fallisce veloce, prima di Build Lambda package) cosi' un tag non valido blocca la pipeline in pochi secondi invece che dopo il build e l'inizio dell'apply reale.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Script/check che valida i tag value di ogni risorsa DynamoDB in backend/terraform contro il set di caratteri reale documentato da AWS (verificato, non a memoria)
- [ ] #2 Il check gira come step dedicato in deploy.yml prima di Build Lambda package, cosi' fallisce entro pochi secondi invece che a meta' di un terraform apply reale
- [ ] #3 Il check viene eseguito anche localmente in questa sessione sui tag esistenti in main.tf per confermare che non ci siano altre violazioni non ancora scoperte
<!-- AC:END -->
