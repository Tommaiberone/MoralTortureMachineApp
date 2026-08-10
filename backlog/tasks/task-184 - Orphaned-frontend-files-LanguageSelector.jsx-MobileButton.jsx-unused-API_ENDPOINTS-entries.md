---
id: TASK-184
title: >-
  Orphaned frontend files: LanguageSelector.jsx, MobileButton.jsx, unused
  API_ENDPOINTS entries
status: Backlog
assignee: []
created_date: '2026-08-10 10:25'
labels:
  - frontend
  - cleanup
dependencies: []
priority: low
type: chore
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
frontend/src/components/LanguageSelector.jsx and frontend/src/components/MobileButton.jsx are never imported anywhere in the app (confirmed by grep). frontend/src/config/api.js:17-25 defines API_ENDPOINTS.getDilemma/vote/analyzeResults/getStoryFlow/storyNodeVote/generateDilemma/authMe, none of which are ever referenced via API_ENDPOINTS.* - every screen builds its own URL string from VITE_API_URL instead; only analyticsEvents and analyticsAdminOverview are actually used from that object. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 LanguageSelector.jsx and MobileButton.jsx are either wired up or removed
- [ ] #2 Unused API_ENDPOINTS entries are removed, or every screen is migrated to use them consistently
<!-- AC:END -->
