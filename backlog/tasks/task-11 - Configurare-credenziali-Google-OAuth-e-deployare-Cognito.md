---
id: TASK-11
title: Configurare credenziali Google OAuth e deployare Cognito
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-29 13:32'
labels:
  - m1-auth
  - auth
  - infra
  - web
dependencies:
  - TASK-5
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creare il client OAuth Google, valorizzare i secret previsti e applicare le risorse Cognito del solo stack prod.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Callback e logout URL prod sono configurati
- [x] #2 Login Google completa il round trip in produzione
- [x] #3 Nessun client secret entra nel bundle frontend
- [x] #4 Il primo account può essere promosso nel gruppo admins
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: verifica read-only con AWS CLI --profile personal: nessun user pool moral-torture-machine presente in eu-west-1. Restano necessari Google OAuth client ID/secret e terraform apply esplicitamente autorizzato.

2026-07-29: secret Google aggiunti su GitHub dall owner. Il primo apply ha creato pool/provider/domain ma Cognito ha rifiutato i due app client perché write_attributes ometteva email, attributo obbligatorio; corretti entrambi a email+name e validato Terraform per il retry.

2026-07-29 retry 2: pool, provider Google, dominio, gruppo admin e app client web/Android creati; Lambda aggiornata. Apply fermato solo dall access-log API Gateway con variabile path errata, corretta per il retry finale.

2026-07-29 deploy riuscito nel run GitHub Actions 30455802320. Verificati: client web e Android live, callback/logout prod, redirect Cognito 302 verso Google, nessun secret nel bundle, gruppo admins presente. Resta la AC #2: round trip reale dopo il primo login dell owner.

2026-07-29: dopo il login reale di tommasobersani@gmail.com, utente Cognito Google_102630893387646173119 aggiunto e verificato nel gruppo admins. Per recepire il claim il browser deve emettere un nuovo ID token tramite logout/login.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Google/Cognito è operativo in produzione; callback e client web/Android sono configurati e il primo amministratore è nel gruppo admins.
<!-- SECTION:FINAL_SUMMARY:END -->
