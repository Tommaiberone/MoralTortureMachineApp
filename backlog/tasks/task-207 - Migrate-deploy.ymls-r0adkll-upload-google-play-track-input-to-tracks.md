---
id: TASK-207
title: Migrate deploy.yml's r0adkll/upload-google-play 'track' input to 'tracks'
status: Done
assignee: []
created_date: '2026-08-31 09:04'
updated_date: '2026-09-01 15:54'
labels:
  - ci
  - tech-debt
dependencies: []
priority: low
type: chore
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 2026-08-31 Play Store publish run (33375430473) logged: WARNING!! 'track' is deprecated and will be removed in a future release. Please migrate to 'tracks'. .github/workflows/deploy.yml's play-store-publish job still passes the single-value 'track' input to r0adkll/upload-google-play@v1; the action now prefers a 'tracks' list input. Low urgency (still works today), but will break a future publish once the deprecated input is actually removed upstream.
<!-- SECTION:DESCRIPTION:END -->
