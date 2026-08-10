---
id: TASK-181
title: AnalyticsConsent banner copy bypasses i18next entirely
status: Done
assignee: []
created_date: '2026-08-10 10:25'
updated_date: '2026-08-10 13:39'
labels:
  - frontend
  - i18n
  - legal
dependencies: []
priority: medium
type: bug
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AnalyticsConsent.jsx's entire consent-banner copy object (title, body, accept, reject, prefs, privacy, cookies, terms - around lines 11-20) is a hardcoded English literal object, never routed through t()/i18next, unlike every other user-facing surface in the app. This is a legal/consent-relevant surface, which makes the inconsistency more significant than an ordinary copy gap. Found during a full-app walkthrough requested by the user after the TASK-177 profile redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The consent banner's copy is sourced from i18next translation keys like every other screen, not a hardcoded object
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AnalyticsConsent.jsx e PrivacyFooter riscritte per usare useTranslation()/t('consent.*') invece dell'oggetto copy hardcoded. Nuova sezione consent in en.json.
<!-- SECTION:NOTES:END -->
