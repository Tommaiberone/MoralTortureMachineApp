---
id: TASK-93
title: Deployare il frontend web corrente in produzione
status: Done
assignee: []
created_date: '2026-07-29 12:10'
updated_date: '2026-07-29 12:13'
labels:
  - deployment
  - frontend
  - aws
  - web
dependencies: []
documentation:
  - CLAUDE.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validare e pubblicare il frontend corrente nel bucket S3 prod, invalidare CloudFront e verificare gli endpoint pubblici senza modificare backend o APK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Lint e build production completano con successo
- [x] #2 Il contenuto dist viene sincronizzato nel bucket frontend prod
- [x] #3 La cache CloudFront viene invalidata e raggiunge stato Completed
- [x] #4 Homepage e dashboard analytics rispondono correttamente dal dominio pubblico
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-07-29: pnpm lint e build:prod passati; API prod verificata contro API Gateway live; sincronizzato frontend/dist su s3://prod-moral-torture-machine-frontend con --delete; invalidazione CloudFront INEOXPKP2DHPZF8VO7AQBFG2P completata; homepage e /admin/analytics rispondono 200 e servono il bundle index-DRCm9bPg.js. Deploy web-only: nessun bump Android/APK necessario. Cognito resta non configurato finché TASK-11 è bloccato.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Frontend web corrente pubblicato con successo su S3/CloudFront e verificato sul dominio di produzione.
<!-- SECTION:FINAL_SUMMARY:END -->
