---
id: TASK-267
title: >-
  Upgrade a Managed Login v2 con branding assegnato, al posto del workaround
  Classic UI di TASK-263
status: In Progress
assignee: []
created_date: '2026-09-05 17:49'
updated_date: '2026-09-05 18:04'
labels:
  - cognito
  - auth
  - infra
dependencies: []
priority: high
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-263/ADR-115 avevano risolto il 403 di Hosted UI riportando managed_login_version a 1 (Classic UI) invece di adottare aws_cognito_managed_login_branding, perche' quella risorsa richiede AWS provider hashicorp/aws >= 6.12 (qui pinnato ~> 5.0) e ha un bug noto sotto 6.13 con piu' di un app client. L'utente ha visto la Classic UI risultante ('davvero brutta, la schermata di AWS non personalizzata') e ha esplicitamente autorizzato il bump del provider Terraform per risolvere alla radice. Decisione: bump a ~> 6.13 (provider installato 6.63.0), managed_login_version tornato a 2, aggiunta aws_cognito_managed_login_branding per web e android con use_cognito_provided_values = true come primo passo sicuro (lo schema completo del campo settings e' ampio/pensato per essere generato dal Branding Designer visuale in console, non da indovinare a mano in una pipeline CI ad auto-apply) - la personalizzazione dark/horror-theme vera e propria e' un passo successivo, da fare leggendo prima il settings_all reale prodotto da questo deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 backend/terraform: provider aws aggiornato a ~> 6.13, .terraform.lock.hcl rigenerato, terraform validate pulito (a parte gli errori pre-esistenti e non correlati di lambda_function.zip mancante in locale)
- [x] #2 aws_cognito_managed_login_branding creata per web e android con use_cognito_provided_values = true
- [x] #3 Dopo il deploy CI, GET /login con i parametri del client web risponde 200 e mostra la pagina Managed Login (non piu' Classic UI ne' l'errore 403)
- [x] #4 ADR aggiunto in decision-1 che documenta il superamento del workaround di ADR-115
- [ ] #5 settings JSON custom (dark/horror-theme, verificato con lo stesso set di chiavi del documento reale generato da AWS, 0 chiavi mancanti/extra) sostituisce use_cognito_provided_values, deployato e verificato visivamente
<!-- AC:END -->
