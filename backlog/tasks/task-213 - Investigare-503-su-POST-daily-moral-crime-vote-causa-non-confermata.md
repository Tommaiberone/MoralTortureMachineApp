---
id: TASK-213
title: Investigare 503 su POST /daily-moral-crime/vote (causa non confermata)
status: To Do
assignee: []
created_date: '2026-08-31 10:17'
labels:
  - backend
  - daily-moral-crime
dependencies: []
priority: high
type: bug
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segnalato dall'utente in produzione subito dopo il fix di TASK-208: POST /daily-moral-crime/vote risponde 503 {detail: 'Daily vote recording is temporarily unavailable'}. Questo e' il path di fallback generico in vote_daily_moral_crime quando dynamodb.meta.client.transact_write_items solleva un ClientError diverso da un TransactionCanceledException dovuto a voto ripetuto (backend_fastapi.py ~riga 2533-2545). Verificato via lettura del codice (non ho potuto leggere i CloudWatch logs ne' l'email SNS ops_alerts - il profilo AWS CLI locale e' root, vietato da CLAUDE.md per query di routine, e comunque l'email di notifica usa il placeholder generico 'See CloudWatch logs', non il dettaglio reale, stesso limite gia' documentato da ADR-089/TASK-198): 1) IAM ha dynamodb:TransactWriteItems concesso sulla risorsa daily_moral_crime_votes.arn (main.tf riga 734/753) - confermato applicato con successo nello stesso terraform apply di TASK-206. 2) Nome tabella (env var DAILY_MORAL_CRIME_VOTES_TABLE), key schema (dayKey/entryKey) e riferimento al dilemma (dilemma.get('baseId')) sembrano corretti. 3) Ipotesi piu' probabile ma non confermata: la tabella e' provisioned a sole 5 RCU/5 WCU (ADR-085) e una transact_write_items su 2 item costa il doppio delle WCU normali (~4 WCU per una singola transazione) - un piccolo burst di traffico reale (la feature e' visibile per la prima volta oggi) potrebbe aver causato throttling (ProvisionedThroughputExceededException). Il logging aggiunto in TASK-208 (error.response Message oltre a Code) e' gia' live: la prossima occorrenza mostrera' la causa esatta nei CloudWatch logs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Causa esatta confermata leggendo i CloudWatch logs (ora piu' dettagliati grazie a TASK-208) o l'email ops_alerts alla prossima occorrenza
- [ ] #2 Se la causa e' throughput insufficiente, capacita' della tabella daily_moral_crime_votes aumentata in modo proporzionato (rimane comunque nel Free Tier condiviso, verificare il monte RCU/WCU condiviso attuale prima di alzare)
- [ ] #3 Verificato che un voto reale (utente di test) ora va a buon fine senza 503
<!-- AC:END -->
