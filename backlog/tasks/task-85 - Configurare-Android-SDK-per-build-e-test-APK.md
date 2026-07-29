---
id: TASK-85
title: Configurare Android SDK per build e test APK
status: To Do
assignee: []
created_date: '2026-07-29 11:46'
labels:
  - m1-auth
  - android
  - tooling
  - qa
dependencies: []
documentation:
  - AUTHENTICATION_GUIDE.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Installare o collegare un Android SDK valido nell'ambiente di build e predisporre emulatore o device per compilare e collaudare il login nativo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ANDROID_HOME o sdk.dir punta a un SDK valido con API 36
- [ ] #2 Gradle completa testDebugUnitTest e assembleDebug
- [ ] #3 È disponibile un emulator o device per verificare callback e logout
<!-- AC:END -->
