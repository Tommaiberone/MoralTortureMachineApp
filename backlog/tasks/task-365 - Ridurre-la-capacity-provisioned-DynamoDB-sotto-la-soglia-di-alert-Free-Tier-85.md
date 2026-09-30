---
id: TASK-365
title: >-
  Ridurre la capacity provisioned DynamoDB sotto la soglia di alert Free Tier
  85%
status: In Progress
assignee: []
created_date: '2026-09-30 12:40'
updated_date: '2026-09-30 12:44'
labels:
  - cost
  - aws
  - database
  - terraform
dependencies: []
priority: high
ordinal: 266000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mail AWS 2026-09-30: EU-ReadCapacityUnit-Hrs e EU-WriteCapacityUnit-Hrs a 15.986/18.600 (86%). Non e' traffico: le ore-capacita' provisioned sono capacita' x ore, indipendenti dalle richieste. L'account ha 23 RCU/23 WCU provisioned (verificato live via DescribeTable, nessun'altra tabella provisioned nell'account), cioe' 92,5% del Free Tier ogni mese (17.112/18.600 su 31 giorni): mai sopra il 100%, quindi costo zero, ma l'alert 85% scatta ogni mese verso il giorno 28 e il margine per nuove tabelle e' solo 2/2. Misura CloudWatch settembre (picco al minuto, 16-30 set): daily-moral-crime-votes consuma al massimo 4 RCU/min e 8 WCU/min (0,07 r/s, 0,13 w/s) contro 5/5 provisioned, zero throttle. party_rooms/party_participants restano 5/5: TASK-191 ha gia' visto throttling a 1/1 su GET polling e POST vote, e il gamebook di Natale (ADR-153) passa da Party Room.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 daily_moral_crime_votes passa da 5/5 a 2/2 RCU/WCU in backend/terraform/main.tf, GSI AnonymousUserIndex invariato a 1/1
- [ ] #2 Il totale provisioned dell'account scende a 20 RCU/20 WCU (80% del Free Tier su un mese di 31 giorni, sotto la soglia alert 85%)
- [x] #3 Le tabelle Party Room non vengono toccate
- [x] #4 doc-1 e ADR log aggiornati con misura, scelta e rollback (rialzare la capacity, operazione immediata)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Misura (profilo personal/root in sola lettura, autorizzato dall'utente per questo giro): 23/23 RCU-WCU provisioned su 7 tabelle + 4 GSI dell'app, nessun'altra tabella provisioned nell'account (ai-autofiller e lock Terraform tutti on-demand). Picchi CloudWatch al minuto 16-30/09: daily-moral-crime-votes 4 RCU/min e 8 WCU/min; party-rooms 40 RCU/min e 13 WCU/min; party-participants 79 RCU/min e 8 WCU/min; tabelle 1/1 al massimo 12 RCU/min e 11 WCU/min; zero throttle su tutto il mese. I 503 di TASK-213 erano un bug di serializzazione, non capacity. Cambio: daily_moral_crime_votes 5/5 -> 2/2 (main.tf), pool 20/20 = 80% su 31 giorni. Nessun risparmio economico (la capacity provisioned era gia' gratuita): serve a fermare l'alert mensile 85% e a ridare margine 5/5. Rollback: rialzare la capacity (immediato). terraform fmt/validate e check_dynamodb_tag_values.py ok. Costi reali dell'account e driver: doc-1, snapshot 2026-09-30; follow-up TASK-366 (aggregati, 61% dei WRU on-demand) e TASK-367 (GSI inutilizzati). ADR-154.
<!-- SECTION:NOTES:END -->
