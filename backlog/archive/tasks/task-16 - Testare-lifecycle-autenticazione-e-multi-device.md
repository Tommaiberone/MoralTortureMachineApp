---
id: TASK-16
title: Testare lifecycle autenticazione e multi-device
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-05 18:59'
labels:
  - m1-auth
  - auth
  - qa
dependencies:
  - TASK-11
  - TASK-13
  - TASK-15
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coprire refresh, logout, scadenza token, callback fallita, retry e accesso da più dispositivi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Test automatici coprono scadenza e token non validi
- [ ] #2 Logout rimuove la sessione browser
- [x] #3 Il claim non regredisce su refresh o secondo dispositivo
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: aggiunti 4 test in backend/tests/test_analytics_models.py::CognitoTokenExpiryAndSignatureTests che esercitano jwt.decode reale (non mockato) con chiavi RSA generate al volo - token scaduto, token firmato con chiave sbagliata, token senza claim obbligatori, e il caso happy-path - tutti passano (152/152 nella suite completa). AC3: gia' coperta da test_users.py::ClaimAnonymousUserIdTests (test_repeating_the_claim_by_the_same_owner_is_a_safe_no_op = refresh/re-claim idempotente, test_claiming_an_id_already_owned_by_another_account_is_rejected = secondo device/account diverso rifiutato con 409 senza toccare il claim esistente). AC2 (logout rimuove la sessione browser) NON spuntata: verificato per code review che signOut() -> clearAuthSession() -> removeAuthStorageItem() chiama sessionStorage.removeItem() sul web (frontend/src/auth/authClient.js:277-280, authStorage.js:21-23), quindi il comportamento sembra corretto, ma il repo non ha alcun test runner frontend (nessun vitest/jest) per verificarlo con un 'test automatico' come richiede l'AC, e CLAUDE.md vieta browser automation per questo tipo di verifica. Aperto TASK-170 per introdurre un test runner frontend leggero (es. Vitest) come lavoro di follow-up dedicato, invece di improvvisare la scelta del tooling dentro questo task.
<!-- SECTION:NOTES:END -->
