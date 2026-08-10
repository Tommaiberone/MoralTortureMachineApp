---
id: TASK-45
title: Integrare notifiche push FCM opt-in
status: Backlog
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-10 14:10'
labels:
  - m5-retention
  - android
  - notifications
  - analytics
dependencies:
  - TASK-43
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Chiedere permesso solo dopo valore dimostrato e misurare delivery, open, completion e opt-out. Valutare il rebuild APK prima dell'implementazione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Permesso non è richiesto al primo avvio
- [ ] #2 Utente può fare opt-out facilmente
- [ ] #3 Metriche push sono privacy-safe
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-10: User explicitly deferred push notifications from the initial Daily release. Keep this task in Backlog; reassess only after measured organic Daily return.
<!-- SECTION:NOTES:END -->
