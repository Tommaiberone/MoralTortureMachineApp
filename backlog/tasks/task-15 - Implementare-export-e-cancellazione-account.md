---
id: TASK-15
title: Implementare export e cancellazione account
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:25'
labels:
  - m1-auth
  - auth
  - privacy
  - backend
  - frontend
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Endpoint e UX per esportare e cancellare i dati utente, inclusa una route web pubblica per la cancellazione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Export include i dati dell'utente in formato portabile
- [x] #2 Cancellazione rimuove i dati salvo retention strettamente documentata
- [x] #3 Il percorso funziona in-app e sul web
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Backend: GET /users/export (JSON portabile: sub, email, createdAt, updatedAt, claimedAnonymousUserIds) e DELETE /users/me (rimuove il record utente e rilascia ogni claim-lock anon#<id> posseduto, cosi' l'id anonimo torna rivendicabile). Nessun altro dominio dati esiste ancora keyed by sub, quindi la cancellazione e' completa oggi: zero eccezioni di retention da documentare finche' TASK-28+ non introduce nuovi domini. Frontend: nuova route pubblica /delete-account (AccountDeleteScreen.jsx), riusa useAuth/authClient esistenti (stesso codice in-app Capacitor e web pubblico), richiede login se non autenticato, doppia conferma per la cancellazione, poi signOut automatico. Nuovo helper getAuthenticatedApiHeaders() in utils/session.js per le chiamate autenticate. 5 nuovi test in test_users.py (export scoping, delete + rilascio claim), 43/43 test totali verdi; pnpm lint e build:prod puliti.
<!-- SECTION:NOTES:END -->
