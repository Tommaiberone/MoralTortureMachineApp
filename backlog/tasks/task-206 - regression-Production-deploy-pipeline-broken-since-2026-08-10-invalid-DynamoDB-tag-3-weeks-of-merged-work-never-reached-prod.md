---
id: TASK-206
title: >-
  [regression] Production deploy pipeline broken since 2026-08-10 (invalid
  DynamoDB tag), 3 weeks of merged work never reached prod
status: In Progress
assignee: []
created_date: '2026-08-31 08:43'
updated_date: '2026-08-31 08:43'
labels:
  - regression
  - infra
  - terraform
  - deploy
dependencies: []
priority: high
type: bug
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reported by the user as: the Play Store app still shows the removed Pass-the-Phone mode. Investigation found the real cause is much broader: every 'Deploy Full Stack' run since commit a1c26b3 (2026-08-10, 'feat: add daily moral crime', versionCode 20/1.7.0) has failed at the Deploy Backend (prod) Terraform apply step, with error 'creating AWS DynamoDB Table (prod-moral-torture-machine-daily-moral-crime-votes): ValidationException: The Tag Value provided is invalid, Value: Anonymous Daily participation and aggregate reveal, retained for 90 days' - a comma is not a valid character in a DynamoDB resource tag value (backend/terraform/main.tf line 465). Because Deploy Backend (prod) fails, every downstream job in the same run is skipped: Build Android APK, Build & Deploy Frontend, Populate DynamoDB, Publish to Google Play. Consequences confirmed from a failed run's logs (run 33373837231): the production Lambda has been running code from 2026-08-10 for 3 weeks (source_code_hash unchanged, last_modified 2026-08-10T14:34:57Z); the frontend on S3/CloudFront has not redeployed either; no new Android AAB has been built or published, so the Play Store app is also stuck around that date - including still having Pass-the-Phone mode (removed in commit 7352de2, 2026-08-07, which predates the freeze but was itself part of the last-published build's history, i.e. never actually reached players either way past this point); the Daily Moral Crime feature (TASK-42/43/44) has never actually gone live despite being marked Done, since its own DynamoDB table has never been successfully created. Fix: backend/terraform/main.tf line 465 tag value comma replaced with a hyphen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 backend/terraform/main.tf's daily_moral_crime_votes tag value no longer contains a comma
- [ ] #2 A push to main runs Deploy Backend (prod) Terraform apply to completion without error
- [ ] #3 The resulting deploy successfully rebuilds and (once explicitly confirmed) publishes a new Android AAB without Pass-the-Phone mode
- [ ] #4 prod-moral-torture-machine-daily-moral-crime-votes table exists in DynamoDB after the fixed apply
<!-- AC:END -->
