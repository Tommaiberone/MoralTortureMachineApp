---
id: TASK-65
title: Separare dati account identificabili da analytics
status: Done
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-01 14:34'
labels:
  - m9-privacy
  - privacy
  - analytics
  - backend
dependencies:
  - TASK-12
  - TASK-13
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Impedire join diretti non necessari tra PII account e comportamento, mantenendo misure aggregate e claim sicuro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Event store non contiene email o token
- [x] #2 Accessi amministrativi seguono least privilege
- [x] #3 Aggregati non permettono re-identificazione ragionevole
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Audit: le protezioni principali erano gia' in vigore da sessioni precedenti - validate_properties() blocca gia' a livello di ingestione qualunque property con una CHIAVE che contiene email/password/token/secret/ip/analysis (Pydantic, prima ancora della scrittura su DynamoDB); users_table (con email, keyed by Cognito sub) non viene mai letta ne' incrociata dal codice di analytics/abuse (build_analytics_overview, build_abuse_monitoring leggono solo product_events/user_analytics keyed by anonymousUserId/sessionId); /admin/analytics/overview espone solo identity mascherate via _masked_identity() (SHA256 troncato), mai il anonymousUserId grezzo negli anomaly/recent-events; l'accesso admin richiede gia' solo un token Cognito verificato con gruppo admins (ADR-013), nessun fallback a chiave. Aggiunta una difesa in profondita' mancante: validate_properties ora rifiuta anche properties il cui VALORE (non solo la chiave) somiglia a un'email o a un JWT/bearer token (_EMAIL_LIKE_PATTERN/_JWT_LIKE_PATTERN in backend_fastapi.py), cosi' un bug frontend che manda per errore un'email in un campo dal nome innocuo (es. 'note') viene comunque bloccato all'ingestione. 4 nuovi test in test_analytics_models.py; intera suite (83 test) passa.
<!-- SECTION:FINAL_SUMMARY:END -->
