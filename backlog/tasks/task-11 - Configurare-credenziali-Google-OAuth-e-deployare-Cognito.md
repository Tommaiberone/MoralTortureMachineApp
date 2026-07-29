---
id: TASK-11
title: Configurare credenziali Google OAuth e deployare Cognito
status: In Progress
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-29 13:18'
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
- [ ] #1 Callback e logout URL prod sono configurati
- [ ] #2 Login Google completa il round trip in produzione
- [ ] #3 Nessun client secret entra nel bundle frontend
- [ ] #4 Il primo account può essere promosso nel gruppo admins
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: verifica read-only con AWS CLI --profile personal: nessun user pool moral-torture-machine presente in eu-west-1. Restano necessari Google OAuth client ID/secret e terraform apply esplicitamente autorizzato.

2026-07-29: secret Google aggiunti su GitHub dall owner. Il primo apply ha creato pool/provider/domain ma Cognito ha rifiutato i due app client perché write_attributes ometteva email, attributo obbligatorio; corretti entrambi a email+name e validato Terraform per il retry.
<!-- SECTION:NOTES:END -->
