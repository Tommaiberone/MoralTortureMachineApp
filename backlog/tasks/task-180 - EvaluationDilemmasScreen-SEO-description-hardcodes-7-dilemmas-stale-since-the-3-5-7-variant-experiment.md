---
id: TASK-180
title: >-
  EvaluationDilemmasScreen SEO description hardcodes '7 dilemmas', stale since
  the 3/5/7 variant experiment
status: To Do
assignee: []
created_date: '2026-08-10 10:24'
labels:
  - frontend
  - seo
  - content
dependencies: []
priority: low
type: bug
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EvaluationDilemmasScreen.jsx's SEO description (around line 336) says 'Take a comprehensive moral evaluation through 7 carefully selected ethical dilemmas', but TASK-23 (this session) made the test length a deterministic 3/5/7 variant per visitor - most users now get 3 or 5, not 7. The copy is now factually wrong for most visitors and any crawler/share-preview reading it. Small, likely a one-line fix. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The SEO description no longer commits to a fixed dilemma count that contradicts the 3/5/7 variant experiment
<!-- AC:END -->
