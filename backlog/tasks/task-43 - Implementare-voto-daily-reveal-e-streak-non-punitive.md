---
id: TASK-43
title: 'Implementare voto daily, reveal e streak non punitive'
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-10 14:45'
labels:
  - m5-retention
  - frontend
  - backend
  - growth
dependencies:
  - TASK-42
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raccogliere un voto Daily a due opzioni, rivelando le percentuali aggregate e una riflessione editoriale solo dopo un voto idempotente. Nessuna streak, premio o altro meccanismo di gamification nella prima release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il reveal degli aggregati avviene solo dopo il voto
- [x] #2 Ogni identita' puo' dare un solo voto immutabile per giorno, con retry idempotente
- [x] #3 La partecipazione Daily e' misurabile con eventi privacy-safe
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-10 14:10
---
2026-08-10 product decision: post-vote reveal only; no streak or other gamification in the initial release.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented an atomic anonymous daily vote, post-vote aggregate reveal, immutable idempotent retries, and privacy-safe generic participation events. No streak or gamification was added.
<!-- SECTION:FINAL_SUMMARY:END -->
