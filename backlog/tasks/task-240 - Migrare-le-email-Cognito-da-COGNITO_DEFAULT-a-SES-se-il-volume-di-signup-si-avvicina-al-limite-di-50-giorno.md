---
id: TASK-240
title: >-
  Migrare le email Cognito da COGNITO_DEFAULT a SES se il volume di signup si
  avvicina al limite di 50/giorno
status: To Do
assignee: []
created_date: '2026-09-04 13:27'
updated_date: '2026-09-04 13:28'
labels:
  - backend
  - auth
dependencies: []
priority: low
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-227 aggiunge login email+password Cognito nativo. Cognito invia le email di verifica signup e reset password tramite il mailer built-in COGNITO_DEFAULT, che ha un limite fisso di 50 email/giorno per l'intero user pool (no-reply@verificationemail.com). A basso volume di signup va bene e non ha costi; se il volume si avvicina al limite le email iniziano a fallire silenziosamente. Passare a un email_configuration basato su SES (dominio verificato, DKIM, eventuale uscita dal sandbox SES) quando serve piu' capacita'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Misurare o stimare il volume giornaliero di signup+reset email+password prima di decidere
- [ ] #2 Se vicino a 50/giorno, configurare SES (dominio verificato, DKIM) e passare aws_cognito_user_pool.users.email_configuration a email_sending_account = DEVELOPER con source_arn SES, seguendo il vincolo Free Tier di CLAUDE.md
- [ ] #3 Verificare in produzione che signup e reset password continuino a consegnare le email dopo il passaggio
<!-- AC:END -->
