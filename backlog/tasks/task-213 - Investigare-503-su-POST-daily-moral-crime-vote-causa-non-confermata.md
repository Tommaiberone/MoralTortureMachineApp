---
id: TASK-213
title: Investigare 503 su POST /daily-moral-crime/vote (causa non confermata)
status: Done
assignee: []
created_date: '2026-08-31 10:17'
updated_date: '2026-09-02 12:39'
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
- [x] #1 Causa esatta confermata leggendo i CloudWatch logs (ora piu' dettagliati grazie a TASK-208) o l'email ops_alerts alla prossima occorrenza
- [x] #2 Se la causa e' throughput insufficiente, capacita' della tabella daily_moral_crime_votes aumentata in modo proporzionato (rimane comunque nel Free Tier condiviso, verificare il monte RCU/WCU condiviso attuale prima di alzare)
- [x] #3 Verificato che un voto reale (utente di test) ora va a buon fine senza 503
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Risolto - gia' corretto in produzione, mai chiuso nel backlog. Trovato durante /ops-alerts-sweep (2026-09-02): il commit edc2288 (2026-09-01... in realta' 2026-08-31 12:52 CEST) 'fix: [regression] Daily Moral Crime vote transaction (TASK-213), root cause found' aveva gia' identificato e corretto la causa reale, diversa dall'ipotesi di throttling: non era ProvisionedThroughputExceededException ma ValidationException 'Incorrect operand type for operator or function; operator: ADD, operand type: MAP' - vote_daily_moral_crime usava dynamodb.meta.client.transact_write_items(), il cui event handler di auto-serializzazione ri-serializzava una seconda volta i valori gia' costruiti a mano da _dynamodb_item(), trasformando {'N':'1'} in {'M':{'N':{'S':'1'}}}. Ogni singolo voto falliva al 100% da quando la feature era diventata raggiungibile (TASK-206). Fix: usare dynamodb_client (client boto3 grezzo, mai toccato da un resource) invece di dynamodb.meta.client. Confermato via CloudWatch logs (profilo mtm-ops-readonly, TASK-224/ADR-102): tutti e 7 gli alert 503 nella tabella ops_error_alerts risalgono a prima delle 10:52 UTC del 2026-08-31 (ultimo alle 10:37:50Z), zero occorrenze dopo il fix; primo voto riuscito post-fix osservato alle 13:09:35Z (POST /daily-moral-crime/vote -> 200). Le 7 righe corrispondenti sono state eliminate dalla tabella ops_error_alerts durante lo stesso sweep.
<!-- SECTION:NOTES:END -->
