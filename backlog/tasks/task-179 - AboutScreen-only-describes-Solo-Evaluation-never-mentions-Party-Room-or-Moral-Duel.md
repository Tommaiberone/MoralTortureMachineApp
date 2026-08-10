---
id: TASK-179
title: >-
  AboutScreen only describes Solo Evaluation, never mentions Party Room or Moral
  Duel
status: To Do
assignee: []
created_date: '2026-08-10 10:24'
labels:
  - frontend
  - content
dependencies: []
priority: medium
type: bug
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AboutScreen.jsx's Game Modes section (around line 91-103) only describes solo Evaluation. It says nothing about Party Room or Moral Duel/Challenge - the actual core comparison loop per doc-2 - so the page reads as describing a single-player quiz app. Distinct from TASK-145 (Done), which removed false Story Mode/Pass-the-Phone claims from the same section but did not add the missing modes. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AboutScreen's Game Modes section describes Party Room and Moral Duel alongside Evaluation, accurately reflecting what a visitor can actually do
<!-- AC:END -->
