---
id: TASK-156
title: >-
  Results screen sharing is fragmented across text-only share and a separate
  share-card download
status: To Do
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-08-31 15:12'
labels:
  - frontend
  - growth
  - sharing
dependencies: []
priority: high
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ResultsScreen.jsx WhatsApp/Facebook buttons (lines 267-294) send a text-only message, while the richer canvas share card added by TASK-133 (lines 297-315) is a separate download the user must manually attach in a different app - no single flow produces the card, ready to send. Matters for the result-to-share rate growth gate in doc-2 (target >=15%). Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-31 15:12
---
TASK-166 rimisurato 2026-08-31: share rate su finestra pulita 2026-08-06/2026-08-31 (25.6gg, post-fix TASK-149) = 56/472 = 11,86% (era 3,4% il 2026-08-05, in miglioramento ma ancora sotto il gate 15%). Escalation automatica ad Alta priorita' e To Do per protocollo TASK-166 AC#2.
---
<!-- COMMENTS:END -->
