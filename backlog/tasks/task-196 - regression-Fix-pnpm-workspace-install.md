---
id: TASK-196
title: '[regression] Fix pnpm workspace install'
status: Done
assignee: []
created_date: '2026-08-10 14:31'
updated_date: '2026-08-10 14:46'
labels:
  - tooling
  - frontend
  - ci
dependencies: []
priority: high
type: bug
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The deployment command ignores frontend/pnpm-workspace.yaml, so allowBuilds.esbuild is skipped and Vite cannot build.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 pnpm install applies the esbuild allowBuilds setting
- [x] #2 Web and Android jobs use the corrected install command
- [x] #3 pnpm lint and pnpm build:prod pass
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored workspace-aware pnpm installs in the web and Android deployment jobs. The esbuild allowBuilds configuration is now honored; lint and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
