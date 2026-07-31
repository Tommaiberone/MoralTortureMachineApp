---
id: TASK-7
title: Validare funnel e qualità dati tra web e Android
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 12:36'
labels:
  - m0-foundation
  - analytics
  - qa
  - android
  - web
dependencies:
  - TASK-6
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verificare copertura, duplicati, ordinamento e parità semantica degli eventi sulle due piattaforme.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La dashboard mostra volumi e conversioni separati per web e Android
- [x] #2 Le discrepanze di schema o comportamento sono documentate o corrette
- [x] #3 I dati inferred restano separati dagli exact
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verifica su dati reali (profilo AWS 'personal', sola lettura): la tabella prod-moral-torture-machine-product-events (pipeline idempotente con platform esatto, TASK-2) e' VUOTA (0 item, confermato via Scan Select=COUNT), da quando e' stata distribuita. Causa reale trovata nei log CloudWatch: il ruolo IAM della Lambda non ha il permesso dynamodb:BatchWriteItem su quella tabella (AccessDeniedException su ogni chiamata POST /analytics/events, ogni evento web e Android viene silenziosamente perso e re-accodato all'infinito lato client). Corretto in backend/terraform/main.tf aggiungendo BatchWriteItem e DeleteItem (necessario anche per la nuova DELETE /users/me di TASK-15) alla policy IAM lambda_permissions. RICHIEDE terraform apply per avere effetto in produzione, non ancora eseguito. Campione reale di 200 item dalla tabella legacy user_analytics: 0/200 hanno l'attributo platform esplicito, confermando che oggi in produzione la copertura 'exact' e' di fatto vicina allo zero fino a quando il fix IAM non viene applicato. Dashboard e separazione exact/inferred sono gia' implementate correttamente lato codice (build_analytics_overview, platformResolution, AnalyticsAdminScreen); il gap reale era esclusivamente nei permessi IAM di produzione.
<!-- SECTION:NOTES:END -->
