---
id: TASK-154
title: Party mode CTA bypasses the tutorial gate the other two modes use
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-07 11:05'
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
HomeScreen.jsx:127-133 calls navigate(/party) directly, while Evaluation (line 97) goes through handleNavigation() (lines 29-42), which shows TutorialScreen on first use per mode. Inconsistent first-run experience between the homepage's two remaining primary CTAs. Verified by reading the file directly (TASK-111 UX audit).

2026-08-07 (TASK-173): originally described as three CTAs (Evaluation, Pass-the-Phone, Party); Pass-the-Phone was removed, so this is now a two-way inconsistency (Evaluation gated by tutorial, Party is not), not three.
<!-- SECTION:DESCRIPTION:END -->
