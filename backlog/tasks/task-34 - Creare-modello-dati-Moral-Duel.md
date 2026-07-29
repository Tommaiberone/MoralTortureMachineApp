---
id: TASK-34
title: Creare modello dati Moral Duel
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m4-duel
  - backend
  - database
  - security
dependencies:
  - TASK-28
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creare Challenges e ChallengeParticipants con token sicuro, dilemma, stato, risposte, profilo, lingua e TTL.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Token non enumerabili, revocabili e mai loggati
- [ ] #2 Challenge abbandonate scadono via TTL
- [ ] #3 Risposte e dati privati non sono esposti prima dello sblocco
<!-- AC:END -->
