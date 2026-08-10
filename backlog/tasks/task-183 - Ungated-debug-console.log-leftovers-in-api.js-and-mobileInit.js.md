---
id: TASK-183
title: Ungated debug console.log leftovers in api.js and mobileInit.js
status: Done
assignee: []
created_date: '2026-08-10 10:25'
updated_date: '2026-08-10 13:39'
labels:
  - frontend
  - cleanup
dependencies: []
priority: low
type: chore
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
frontend/src/config/api.js:9-10 (module load), :35-36,77,86 (apiFetch, used by AnalyticsAdminScreen) and frontend/src/utils/mobileInit.js:80,90 log environment/URL/request details with emoji-prefixed console.log on every call, unconditionally in production - not gated by import.meta.env.DEV, unlike the established console.error-for-real-errors convention elsewhere. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 These debug logs are removed or gated behind import.meta.env.DEV so they no longer run unconditionally in production
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tutti i console.log di debug in api.js e mobileInit.js ora gated da import.meta.env.DEV (o rimossi se ridondanti); console.error lasciati invariati (convenzione esistente per errori reali).
<!-- SECTION:NOTES:END -->
