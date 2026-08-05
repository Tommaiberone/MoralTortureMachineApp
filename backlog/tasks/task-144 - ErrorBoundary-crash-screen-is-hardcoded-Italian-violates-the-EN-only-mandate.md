---
id: TASK-144
title: 'ErrorBoundary crash screen is hardcoded Italian, violates the EN-only mandate'
status: Done
assignee: []
created_date: '2026-08-05 09:05'
updated_date: '2026-08-05 18:34'
labels:
  - bug
  - frontend
  - i18n
dependencies: []
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ErrorBoundary.jsx has no i18next import at all and shows hardcoded Italian strings (e.g. line 69 Qualcosa e andato storto, line 125 Torna alla Home) to every user, web or Android, who hits any uncaught error. This directly contradicts TASK-101/CLAUDE.md: the app UI is currently forced English-only. It is also exactly the moment (a crash) where clear communication matters most. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ErrorBoundary uses i18next like every other screen and renders in English (matching the current EN-only mandate), with Italian strings still present in it.json per the drift exception so nothing breaks if Italian is reactivated later
<!-- AC:END -->
