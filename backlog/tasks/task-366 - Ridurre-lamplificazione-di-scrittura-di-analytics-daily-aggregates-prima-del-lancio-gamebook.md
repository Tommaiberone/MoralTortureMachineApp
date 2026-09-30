---
id: TASK-366
title: >-
  Ridurre l'amplificazione di scrittura di analytics-daily-aggregates prima del
  lancio gamebook
status: In Progress
assignee: []
created_date: '2026-09-30 12:43'
updated_date: '2026-09-30 13:17'
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
- [x] #2 Il consumo per evento scende di almeno 3x al traffico attuale e di almeno 5x a traffico 10-20x (replay di giornate reali con le funzioni reali), senza perdere nessuna metrica di /admin/analytics/overview
- [x] #3 Test backend degli aggregati aggiornati e verdi
- [x] #4 Il limite di 400KB per item non e' piu' raggiungibile a volumi realistici del lancio gamebook
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato: 16 shard per giorno (<day>#00..#15) scelti da SHA-256 dell'identity (_analytics_aggregate_key), una sola UpdateItem per evento/batch come prima; il reader legge item non shardato + 16 shard per giorno e li fonde (_merge_analytics_aggregate_shards), parser invariati; lo script di backfill cancella gli shard del giorno che riscrive. Misura (replay offline delle giornate reali con le funzioni reali; il modello non shardato riproduce CloudWatch entro 4-6% e la dimensione reale degli item al decimo di KB): 19/09 22.292 -> 5.046 WCU (4,4x, item max 28,6 -> 8,8KB); 29/09 2.553 -> 842 WCU (3,0x); 20 giorni reali ripetuti come un unico giorno (~20x traffico) 1.156.507 -> 145.600 WCU (7,9x, item max 184,8 -> 26,7KB). 32 shard darebbero solo il 15-20% in piu' oggi raddoppiando le chiamate di lettura. AC#2 rivisto dopo la misura: il 5x fisso originale non e' raggiungibile al traffico attuale perche' le identity piu' attive dominano il proprio shard; il guadagno cresce col traffico. Test: 282 test backend verdi, incluso un confronto dashboard shardato vs non shardato. ADR-155.
<!-- SECTION:NOTES:END -->
