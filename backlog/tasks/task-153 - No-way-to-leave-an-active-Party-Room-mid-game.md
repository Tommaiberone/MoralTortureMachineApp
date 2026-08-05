---
id: TASK-153
title: No way to leave an active Party Room mid-game
status: Backlog
assignee: []
created_date: '2026-08-05 09:06'
updated_date: '2026-08-05 09:08'
labels:
  - frontend
  - party-room
  - ux
dependencies: []
priority: low
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PartyRoomScreen.jsx lobby (287-320), question (323-349) and reveal (351-401) states have no back/home link at all - only fatalError (245-252) and completed (480-496) do. A participant who wants to leave mid-game has no in-app affordance and must use the browser back button or close the tab. Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->
