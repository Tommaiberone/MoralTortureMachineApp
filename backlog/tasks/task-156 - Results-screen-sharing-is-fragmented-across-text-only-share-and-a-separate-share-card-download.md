---
id: TASK-156
title: >-
  Results screen sharing is fragmented across text-only share and a separate
  share-card download
status: Backlog
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - growth
  - sharing
dependencies: []
priority: low
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ResultsScreen.jsx WhatsApp/Facebook buttons (lines 267-294) send a text-only message, while the richer canvas share card added by TASK-133 (lines 297-315) is a separate download the user must manually attach in a different app - no single flow produces the card, ready to send. Matters for the result-to-share rate growth gate in doc-2 (target >=15%). Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
