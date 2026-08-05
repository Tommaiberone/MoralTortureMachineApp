---
id: TASK-154
title: Party mode CTA bypasses the tutorial gate the other two modes use
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - ux
  - party-room
dependencies: []
priority: low
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HomeScreen.jsx:127-133 calls navigate(/party) directly, while Evaluation (line 97) and Pass-the-Phone (line 117) both go through handleNavigation() (lines 29-42), which shows TutorialScreen on first use per mode. Inconsistent first-run experience across the three primary homepage CTAs. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
