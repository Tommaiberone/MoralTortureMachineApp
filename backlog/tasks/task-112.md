---
id: TASK-112
title: >-
  Fai un'analisi completa dal punto di vista della sicurezza e del costo
  dell'infrastruttura cloud e salva nei Todo del backlog tutti i miglioramenti
  che si possono avere
status: Done
assignee: []
created_date: '2026-07-31 15:06'
updated_date: '2026-08-01 14:46'
labels: []
dependencies: []
ordinal: 22000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sono state verificate dipendenze (pnpm audit, pip-audit), configurazione IAM/CORS/S3/Cognito e confrontate con l'audit Free Tier gia' in doc-1
- [x] #2 Ogni miglioramento reale trovato e non gia' tracciato e' stato salvato come task To Do nel backlog con priorita' e motivazione
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Audit sicurezza: pip-audit su backend/requirements.txt ha trovato 23 CVE note in 3 pacchetti - PyJWT 2.10.1 (libreria di verifica dei token Cognito, quindi priorita' alta -> TASK-114), starlette 0.41.3 e requests 2.32.3 (-> TASK-116). pnpm audit sul frontend ha trovato 38 vulnerabilita' (1 critical, 24 high): react-router (dipendenza di produzione via react-router-dom, XSS/DoS/open-redirect -> TASK-115, priorita' alta), lodash via recharts (-> TASK-117, basso impatto reale ma da valutare), e un blocco di CVE tutte transitive di @capacitor/cli (tar/xmldom/minimatch), che e' solo uno strumento di build locale/CI non spedito nel bundle - rischio reale basso (-> TASK-118 insieme a i18next-http-backend che invece e' runtime). Verificate anche configurazioni: IAM gia' scoped per risorsa (nessun Resource/Action wildcard trovato oltre ai gia' noti allow_headers/allow_methials CORS a livello di API Gateway, che non allentano allow_origins), bucket S3 frontend con public access block attivo, nessun Lambda Function URL esposto (solo via API Gateway). Trovato mfa_configuration=OFF sull'unico User Pool Cognito condiviso anche dal gruppo admins -> TASK-119 (basso, da decidere esplicitamente con un ADR, non da implementare a priori). Non ripetuti i temi gia' tracciati e ancora validi nell'audit Free Tier di doc-1 del 2026-07-29 (tabelle PAY_PER_REQUEST/TASK-88, PITR/TASK-89, tabella legacy/TASK-90, WAF/TASK-67 gia' esteso oggi). Costo: nessuna criticita' nuova oltre a quanto gia' tracciato; nessuna azione di provisioning eseguita da questo audit.
<!-- SECTION:FINAL_SUMMARY:END -->
