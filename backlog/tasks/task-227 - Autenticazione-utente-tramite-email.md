---
id: TASK-227
title: Autenticazione utente tramite email
status: To Do
assignee: []
created_date: '2026-09-01 15:55'
labels: []
dependencies: []
priority: high
type: feature
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere il supporto al login e registrazione tramite email (oltre a Google OAuth) tramite AWS Cognito, supportando sia web che Android con claim dei dati anonimi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Configurare il User Pool Cognito per consentire signup e login con email e password o magic link/OTP
- [ ] #2 Aggiornare la UI di login/signup frontend per offrire l'accesso con email oltre a Google
- [ ] #3 Garantire il corretto claim dei dati della sessione anonima anche per gli utenti registrati via email
- [ ] #4 Verificare il flusso di reset password e conferma indirizzo email
<!-- AC:END -->
