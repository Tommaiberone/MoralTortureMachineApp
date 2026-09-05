---
id: TASK-268
title: >-
  Cognito Managed Login: logo (icona app) e texture di sfondo dark aggiunti come
  asset di branding
status: In Progress
assignee: []
created_date: '2026-09-05 18:27'
updated_date: '2026-09-05 18:28'
labels:
  - cognito
  - auth
  - branding
dependencies: []
priority: medium
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-267: l'utente ha visto il tema dark applicato e lo ha giudicato 'poco horror' (limite reale di Managed Login: niente font custom, niente animazioni, layout fisso AWS). Ha scelto l'opzione intermedia - aggiungere subito logo e sfondo come asset di branding, rimandando un login completamente custom a un'iniziativa separata (vedi TASK-269). Fatto: aws_cognito_managed_login_branding.web/android ora hanno due blocchi asset (category=FORM_LOGO, PNG, riusa frontend/public/favicon-512x512.png - l'icona app esistente, mai duplicata) e (category=PAGE_BACKGROUND, SVG, nuovo file backend/terraform/assets/cognito-login-background.svg - vignetta scura + crepe/cicatrici sottili in stile 'cuore meccanico cucito' + scanline, senza testo duplicato). components.form.logo.enabled portato a true nel locals.cognito_branding_settings (era false) cosi' il logo appare davvero. Schema verificato via 'terraform providers schema -json' sul provider realmente installato (asset e' un nested block set con category/color_mode/extension required, bytes optional) prima di scrivere il codice, non per tentativi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 aws_cognito_managed_login_branding.web e .android hanno asset FORM_LOGO (favicon-512x512.png) e PAGE_BACKGROUND (cognito-login-background.svg), entrambi color_mode DARK
- [x] #2 components.form.logo.enabled = true nel locals.cognito_branding_settings
- [x] #3 terraform validate pulito (a parte gli errori pre-esistenti lambda_function.zip)
- [ ] #4 Dopo il deploy, GET /login mostra logo e sfondo (verifica manuale dell'utente, no browser automation per CLAUDE.md)
<!-- AC:END -->
