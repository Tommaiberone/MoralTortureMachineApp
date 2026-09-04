---
id: TASK-263
title: >-
  [regression] Cognito Hosted UI login restituisce 403 'Login pages unavailable'
  su tutti i client
status: Done
assignee: []
created_date: '2026-09-04 18:42'
updated_date: '2026-09-04 18:50'
labels:
  - regression
  - auth
  - cognito
dependencies: []
priority: high
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GET .../login su moral-torture-machine-586250839220.auth.eu-west-1.amazoncognito.com restituisce 403 con body Cognito 'Login pages unavailable - Please contact an administrator', sia per il client web (rpd2sus0albirr9gohm48olgj) sia presumibilmente per l'Android client, bloccando sia il login Google sia il nuovo login email+password (TASK-227). Causa: aws_cognito_user_pool_domain.auth ha managed_login_version = 2 (Managed Login) ma nessun app client ha uno style di branding assegnato (richiesto dalla risorsa aws_cognito_managed_login_branding, disponibile solo da AWS provider hashicorp/aws >= 6.12, mentre qui e pinnato ~> 5.0). Verificato via curl diretto sull'endpoint e via AWS CLI (profilo personal) sullo user pool eu-west-1_VOxU2Onzd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 aws_cognito_user_pool_domain.auth.managed_login_version riportato a 1 (Classic Hosted UI) in backend/terraform/main.tf
- [x] #2 Dopo il deploy, GET /login con i parametri del client web risponde 200 (form di login), non piu 403
- [x] #3 ADR aggiunto in backlog/decisions/decision-1 con causa e alternative valutate (branding style vs downgrade a v1 vs bump provider a 6.x)
<!-- AC:END -->
