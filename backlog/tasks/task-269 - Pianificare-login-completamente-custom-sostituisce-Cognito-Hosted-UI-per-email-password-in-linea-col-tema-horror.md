---
id: TASK-269
title: >-
  Pianificare login completamente custom (sostituisce Cognito Hosted UI per
  email/password), in linea col tema horror
status: Backlog
assignee: []
created_date: '2026-09-05 18:28'
labels:
  - auth
  - design
  - open-decision
dependencies: []
priority: medium
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dopo TASK-267/268, l'utente ha visto che anche con branding + logo + sfondo custom, Managed Login resta 'poco horror': AWS non permette font custom (niente IBM Plex Sans), niente animazioni/glitch, layout fisso deciso da AWS. L'unico modo per un match vero e' costruire lo schermo di login (email/password + bottone Google) dentro l'app stessa, con lo stesso CSS/font/animazioni del resto del prodotto. L'utente ha scelto esplicitamente di rimandare questo a un'iniziativa pianificata a parte invece di improvvisarlo dentro il giro di styling di TASK-267/268. Cosa comporta, gia' emerso in discussione: 1) Google puo' restare un semplice redirect a /oauth2/authorize?identity_provider=Google (bypassa gia' oggi qualunque pagina Cognito, va dritto su Google) - nessun lavoro extra li'. 2) Email/password invece oggi passa dalla pagina Cognito ospitata; per essere custom serve abilitare ALLOW_USER_PASSWORD_AUTH (o SRP) su aws_cognito_user_pool_client.web/android (oggi solo ALLOW_REFRESH_TOKEN_AUTH) e reimplementare dentro l'app: sign-in, sign-up, verifica email (codice), forgot/reset password, mappatura in copy leggibile di tutti i codici di errore Cognito (UserNotFoundException, NotAuthorizedException, UsernameExistsException, CodeMismatchException, InvalidPasswordException, LimitExceededException, ecc.), e visualizzazione della password policy. 3) Questo ribalta esplicitamente la scelta di ADR-113 di NON costruire quella superficie proprio per evitare il costo di manutenzione/traduzione/allineamento con la validazione di Cognito - va scritto un nuovo ADR che documenti il cambio di rotta quando si procede. Non e' stato scritto nessun codice per questo task: e' solo la sede per pianificarlo quando si decide di procedere.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utente conferma di voler procedere (o l'ambito preciso: solo sign-in, o anche sign-up/reset/verify) prima di iniziare l'implementazione
- [ ] #2 Elenco schermate/stati da costruire concordato: sign-in, sign-up, verifica email, forgot password, reset password, mappatura errori
- [ ] #3 ALLOW_USER_PASSWORD_AUTH (o SRP) abilitato sui client Cognito solo quando si inizia davvero l'implementazione, non prima
- [ ] #4 Nuovo ADR in decision-1 che documenta il ribaltamento di ADR-113 con motivazione
<!-- AC:END -->
