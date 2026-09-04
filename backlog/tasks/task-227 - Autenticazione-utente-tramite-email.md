---
id: TASK-227
title: Autenticazione utente tramite email
status: In Progress
assignee: []
created_date: '2026-09-01 15:55'
updated_date: '2026-09-04 13:32'
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
- [x] #1 Configurare il User Pool Cognito per consentire signup e login con email e password o magic link/OTP
- [x] #2 Aggiornare la UI di login/signup frontend per offrire l'accesso con email oltre a Google
- [x] #3 Garantire il corretto claim dei dati della sessione anonima anche per gli utenti registrati via email
- [ ] #4 Verificare il flusso di reset password e conferma indirizzo email
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato: aggiunto COGNITO come identity provider nativo su entrambi gli app client (web+Android) accanto a Google, con email_configuration COGNITO_DEFAULT esplicito (limite 50 email/giorno, vedi TASK-240). Il pulsante di login e' stato unificato: authClient.js non forza piu' identity_provider=Google nell'URL di /oauth2/authorize, quindi la managed login page di Cognito mostra sia il form email+password (con link nativi 'Sign up' e 'Forgot your password?') sia il bottone Google sulla stessa schermata, dietro un solo bottone 'Sign in' nell'app (AuthButton.jsx e le altre 2 call-site). beginGoogleSignIn/completeGoogleSignIn/isGoogleAuthAvailable rinominate in modo provider-agnostico; l'evento analytics ora traccia il provider reale letto dal claim ID token 'identities' (federato) o 'email' (nativo) invece di un valore 'google' hardcoded. claimAnonymousData/backend restano invariati: erano gia' provider-agnostici. Nessun cambio Android nativo necessario (nessun SDK Google Sign-In, solo lo stesso deep link generico). Pending: verifica live end-to-end di signup, verifica email e reset password dopo il deploy (AC4) - non eseguibile da qui (niente browser/Cognito deployato in locale).
<!-- SECTION:NOTES:END -->
