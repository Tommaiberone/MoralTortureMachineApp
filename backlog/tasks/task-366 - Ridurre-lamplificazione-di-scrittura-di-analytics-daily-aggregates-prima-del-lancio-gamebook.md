---
id: TASK-366
title: >-
  Ridurre l'amplificazione di scrittura di analytics-daily-aggregates prima del
  lancio gamebook
status: To Do
assignee: []
created_date: '2026-09-30 12:43'
labels:
  - cost
  - aws
  - database
  - analytics
dependencies: []
priority: medium
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Misura 2026-09-30 (TASK-365): dal cutover del 10/09 la tabella analytics-daily-aggregates ha consumato ~147k WRU in 20 giorni (~7,3k WRU/giorno, fino a 23k il 19/09), il 61% di tutte le scritture on-demand DynamoDB dell'account (238k WRU a settembre), contro poche migliaia di richieste API al giorno. Causa gia' prevista nel commento Terraform (ADR-139): UpdateItem e' fatturato sulla dimensione dell'item dopo la scrittura, e ogni evento aggiorna l'unico item del giorno (in media ~11KB, 1,25MB su 111 item), quindi ogni evento costa ~10 WRU. Costo oggi ~USD 0,15/mese, ma cresce circa col quadrato del traffico giornaliero (numero di scritture x dimensione dell'item, che cresce con gli identity Set): a 10x traffico, per esempio col lancio gamebook di Natale (ADR-153), diventa ordine di USD 10+/mese. Opzioni gia' indicate da ADR-139: spezzare l'item largo del giorno in piu' item piccoli (counter separati dagli identity Set, o sharding per famiglia di dimensioni) oppure bufferizzare gli incrementi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 WRU per evento misurati prima e dopo su CloudWatch (ConsumedWriteCapacityUnits della tabella)
- [ ] #2 Il consumo per evento scende di almeno 5x senza perdere nessuna metrica di /admin/analytics/overview
- [ ] #3 Test backend degli aggregati aggiornati e verdi
<!-- AC:END -->
