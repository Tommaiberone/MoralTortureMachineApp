---
id: TASK-15.1
title: Estendere export e cancellazione a dati sociali e Cognito
status: In Progress
assignee: []
created_date: '2026-08-06 13:45'
updated_date: '2026-08-06 15:03'
labels:
  - privacy
  - account
  - backend
  - frontend
  - android
dependencies:
  - TASK-64
parent_task_id: TASK-15
priority: high
type: enhancement
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estende TASK-15 dopo l'introduzione di profili, Moral Duel, Party Room e analytics. La cancellazione deve rimuovere account Cognito, record account, claim-lock e tutti i dati collegati agli anonymous ID reclamati; l'export deve includere i dati portabili nello stesso perimetro. La retention confermata e' 12 mesi di inattivita' per account/profili, salvo i limiti piu' brevi gia' stabiliti per gli altri domini.

Release prevista: `1.6.3` / `versionCode 18` -> `1.6.4` / `versionCode 19` (necessaria per la pulizia locale web/Android e le disclosure utente).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'export include account, profili, partecipazioni sociali e analytics collegati agli anonymous ID reclamati senza esporre dati di altri utenti.
- [x] #2 La cancellazione elimina Cognito, account, claim-lock e dati collegati agli anonymous ID reclamati; conserva soltanto statistiche non riconducibili all'utente.
- [x] #3 Web e Android eliminano anche gli identificatori e la coda locale dopo una cancellazione riuscita.
- [ ] #4 Terraform concede il minimo privilegio necessario e mantiene la compatibilita' con le build Android distribuite.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-06: implementati export/cancellazione v2 per account, Cognito, claim-lock, profili, partecipazioni sociali e analytics degli anonymous ID reclamati; svuotamento degli ID e dati locali web/Android dopo delete riuscita; IAM Terraform separato e minimo per sweep. Verificati 75 test backend mirati, ESLint, build Vite e terraform validate. AC #4 resta aperto: bundleRelease locale e' bloccato solo dall'assenza di Android SDK (ANDROID_HOME/sdk.dir) nella macchina; non e' stata installata una SDK senza autorizzazione.

Review finale 2026-08-06: aggiunto heartbeat /auth/me e touch server-side condizionale dell'attivita' account; ogni uso riuscito di un profilo rinnova la retention senza ricrearlo dopo una delete concorrente; anche il rate-limit log usa solo firme di route. Suite backend mirata finale: 81 test OK.
<!-- SECTION:NOTES:END -->
