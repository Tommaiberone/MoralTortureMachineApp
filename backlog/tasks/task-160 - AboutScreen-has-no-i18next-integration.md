---
id: TASK-160
title: AboutScreen has no i18next integration
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - i18n
  - technical-debt
dependencies: []
priority: low
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AboutScreen.jsx has no useTranslation import and every string is hardcoded English, unlike every other screen in the app (which keep t() calls even while EN-only per TASK-101). Re-enabling Italian later would mean rewriting this page from scratch instead of just re-adding translations. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
