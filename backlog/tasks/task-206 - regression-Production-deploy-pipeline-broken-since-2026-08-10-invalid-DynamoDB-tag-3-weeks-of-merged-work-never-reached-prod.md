---
id: TASK-206
title: >-
  [regression] Production deploy pipeline broken since 2026-08-10 (invalid
  DynamoDB tag), 3 weeks of merged work never reached prod
status: Done
assignee: []
created_date: '2026-08-31 08:43'
updated_date: '2026-08-31 09:04'
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
- [x] #1 backend/terraform/main.tf's daily_moral_crime_votes tag value no longer contains a comma
- [x] #2 A push to main runs Deploy Backend (prod) Terraform apply to completion without error
- [x] #3 The resulting deploy successfully rebuilds and (once explicitly confirmed) publishes a new Android AAB without Pass-the-Phone mode
- [x] #4 prod-moral-torture-machine-daily-moral-crime-votes table exists in DynamoDB after the fixed apply
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Populate DynamoDB (append) confirmed: 27 EN dilemmas added (TASK-201's 15 new + 12 pre-existing EN-only dilemmas that were in dilemmas_en.json but had never reached DynamoDB before - a second, older drift this run incidentally fixed), 17 already-present EN and all 17 IT correctly skipped. Play Store publish (production, versionCode 20/1.7.0) triggered per explicit user confirmation - AC3 now in progress.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Root cause confirmed and fixed: backend/terraform/main.tf's daily_moral_crime_votes tag ('Anonymous Daily participation and aggregate reveal, retained for 90 days') had a comma, which DynamoDB CreateTable rejects (ValidationException). Fixed by replacing the comma with a hyphen (commit 0028329). Verified fixed: GitHub Actions run 33374289840 (push, ordinary deploy) ran Deploy Backend (prod) Terraform apply to 'Apply complete! Resources: 1 added, 5 changed, 0 destroyed' with 'aws_dynamodb_table.daily_moral_crime_votes: Creation complete after 25s' in the log - AC1/AC2/AC4 satisfied. Downstream jobs that had been skipped for 3 weeks ran again in the same run: Build Android APK succeeded (fresh AAB artifact built from current main, no Pass-the-Phone mode), Build & Deploy Frontend (prod) succeeded (S3 + CloudFront now current). Populate DynamoDB and Publish to Google Play were correctly skipped by design (no [populate-db] marker, no versionCode bump in this commit) - not a partial fix. AC3 (publish a new AAB without Pass-the-Phone to Play Store) intentionally left unchecked: an actual Play Store publish is gated behind explicit user confirmation per CLAUDE.md regardless of the general deploy authorization, and hasn't been requested/executed yet - the AAB exists as a build artifact and is ready to publish once confirmed. Also retried the append-only DynamoDB dilemma populate (blocked in the previous attempt by this same regression) via workflow_dispatch.

Play Store publish confirmed successful: run 33375430473 (workflow_dispatch, publish_to_play_store=true, track=production) - Deploy Backend (prod) Terraform apply succeeded again (idempotent, no further errors), Build Android APK produced a fresh AAB from current main (versionCode 20/1.7.0, no Pass-the-Phone), and 'Publish to Google Play (production)' succeeded in 30s. AC3 satisfied. All four ACs now checked; TASK-206 fully resolved end to end.
<!-- SECTION:FINAL_SUMMARY:END -->
