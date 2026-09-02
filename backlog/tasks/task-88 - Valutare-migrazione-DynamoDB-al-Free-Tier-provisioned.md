---
id: TASK-88
title: Valutare migrazione DynamoDB al Free Tier provisioned
status: Done
assignee: []
created_date: '2026-07-29 11:55'
updated_date: '2026-09-02 08:07'
labels:
  - cost
  - aws
  - database
  - terraform
dependencies: []
references:
  - 'https://aws.amazon.com/dynamodb/pricing/'
documentation:
  - backlog/docs/doc-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Le tabelle Moral Torture Machine e i lock Terraform sono PAY_PER_REQUEST, mentre il free tier delle richieste DynamoDB usa capacità provisioned Standard. L'account usa attualmente 0 delle 25 RCU/WCU gratuite in eu-west-1. Decidere l'allocazione senza introdurre throttling prima di cambiare Terraform.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Picchi di lettura e scrittura sono misurati per tabelle e GSI
- [x] #2 Il piano resta entro le 25 RCU e 25 WCU condivise oppure documenta costo ed eccezione approvata
- [x] #3 Allarmi di throttling e rollback a on-demand sono definiti
- [x] #4 La decisione precede qualsiasi modifica al database di produzione
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Risolto 2026-09-02 con misurazione reale. Creato profilo AWS locale read-only mtm-ops-readonly (utente IAM scoped a DynamoDB/CloudWatch/Logs/Lambda/API Gateway/S3/CloudFront sulle sole risorse prod-moral-torture-machine-*, nessun accesso IAM/scrittura/SSM) cosi' non serve piu' root per letture di routine. Picchi CloudWatch reali su 14 giorni (AC#1): dilemmas ~6-8 RCU/~2 WCU (61 item, quasi statica); user-analytics e product-events ~128 RCU in burst (in parte causati dalle scan di analytics/ops interne, non solo da traffico utente reale), ~1-3 WCU. Decisione (AC#2): nessuna migrazione a provisioned per nessuna delle tre. Margine condiviso rimasto e' solo ~4 RCU/4 WCU (21/25 gia' impegnati da ADR-085); dilemmas costa gia' ~0 su on-demand quindi non c'e' risparmio da guadagnare migrandola, e user-analytics/product-events avrebbero bisogno di capacita' ben oltre il margine libero per assorbire i burst dei nostri stessi tool - throttlerebbero l'automazione, non solo gli utenti. Formalizzata come eccezione Free Tier accettata (ADR-011/CLAUDE.md). AC#3 (allarmi throttling/rollback) non applicabile: nessuna migrazione avviene, quindi nessun rollback da definire; le tabelle restano dove sono, senza rischio di throttling nuovo introdotto da questa decisione. AC#4 soddisfatta: nessuna modifica al database di produzione precede questa decisione. Nello stesso giro, verifica congiunta con l'utente ha portato a cancellare (non migrare) le due tabelle a traffico sostanzialmente nullo invece di lasciarle on-demand: prod-moral-torture-machine-story-flows (Story Mode dormant, decisione utente pre-esistente in TASK-185 di rimuovere tutto invece di conservare per TASK-52) e la legacy moral-torture-machine-dilemmas non prefissata (TASK-90, chiuso in parallelo) - entrambe esportate in locale prima della cancellazione. Restano on-demand come eccezione documentata: dilemmas, user-analytics, product-events. doc-1 aggiornato con lo stato reale.
<!-- SECTION:NOTES:END -->
