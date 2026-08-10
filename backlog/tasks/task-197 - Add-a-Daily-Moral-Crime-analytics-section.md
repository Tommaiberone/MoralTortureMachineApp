---
id: TASK-197
title: Add a Daily Moral Crime analytics section
status: Done
assignee: []
created_date: '2026-08-10 14:49'
updated_date: '2026-08-10 14:56'
labels:
  - analytics
  - frontend
  - backend
  - growth
dependencies:
  - TASK-42
documentation:
  - backlog/docs/doc-2
priority: medium
type: feature
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose a dedicated admin-only Daily Moral Crime section in /admin/analytics. It must combine privacy-safe generic Daily funnel events with anonymous aggregate vote counts, without exposing individual choices, IDs, or dilemma text.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Analytics dashboard has a dedicated Daily section with views, votes, reveals, shares, and derived conversion rates
- [x] #2 The section shows aggregate first/second vote distribution and total for the current Daily without exposing individual participation data
- [x] #3 The API remains admin-only and the platform/time filters apply clearly to event-derived metrics
- [x] #4 Backend tests plus frontend lint and production build pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Extend the existing admin overview with a privacy-safe Daily aggregate, render it as a tab, and cover the aggregation contract with unit tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This is part of the already-unreleased 1.7.0/code 20 Daily change set; no additional Android version bump is required unless that build is distributed before this work.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the admin-only Daily Moral Crime tab with privacy-safe event-funnel conversions and the current global aggregate. It uses one projected aggregate GetItem, does not expose participant data, and makes the platform scope explicit. Verified with 40 analytics backend tests, frontend lint, and production build; no live browser check was run per repository policy.
<!-- SECTION:FINAL_SUMMARY:END -->
