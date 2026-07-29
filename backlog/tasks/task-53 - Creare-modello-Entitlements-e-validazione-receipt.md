---
id: TASK-53
title: Creare modello Entitlements e validazione receipt
status: Backlog
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m7-monetization
  - backend
  - database
  - billing
  - security
dependencies:
  - TASK-12
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Entitlement server-side con grant idempotente e verifica ricevute; supporto a restore, refund, revocation, grace ed expiry.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Client non può auto-assegnarsi entitlement
- [ ] #2 Receipt replay non duplica grant
- [ ] #3 Stati refund e revocation rimuovono accesso correttamente
<!-- AC:END -->
