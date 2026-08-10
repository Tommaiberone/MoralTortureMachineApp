---
id: TASK-44
title: Aggiungere social loop al daily
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-10 14:46'
labels:
  - m5-retention
  - frontend
  - sharing
  - growth
dependencies:
  - TASK-40
  - TASK-43
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere al reveal una sola azione Ask the Audience: link pubblico al Daily con attribution UTM, senza social graph, lista amici, sfida diretta o divulgazione della scelta del mittente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ask the Audience e' disponibile solo dopo il reveal e non dichiara la scelta del mittente
- [x] #2 Il link pubblico conserva attribution tramite UTM senza contenere identificatori personali
- [x] #3 Il loop funziona sul frontend condiviso web e Android
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-10 14:10
---
2026-08-10 product decision: initial social loop is Ask the Audience share only, with attribution; no friends list or direct Daily challenge.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the post-reveal Ask the Audience share flow with generic UTM attribution, no sender-choice disclosure, and native/web sharing support.
<!-- SECTION:FINAL_SUMMARY:END -->
