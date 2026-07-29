---
id: TASK-55
title: Integrare checkout web conforme
status: Backlog
assignee: []
created_date: '2026-07-29 11:29'
labels:
  - m7-monetization
  - web
  - billing
dependencies:
  - TASK-53
  - TASK-51
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Checkout web per pack e bundle con webhook idempotenti e riconciliazione entitlement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Webhook firmati sono verificati
- [ ] #2 Retry non duplica pagamento o entitlement
- [ ] #3 Termini e prezzo totale sono chiari
<!-- AC:END -->
