---
id: TASK-27
title: Persistenza enrichment AI e fallback deterministico risultati
status: To Do
assignee: []
created_date: '2026-07-29 11:27'
labels:
  - m2-activation
  - ai
  - cost
  - resilience
dependencies:
  - TASK-26
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Usare template deterministici quando Groq fallisce e salvare ogni enrichment per impedirne la rigenerazione a ogni view.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Il risultato resta completo senza Groq
- [ ] #2 Output AI già generato viene riutilizzato
- [ ] #3 Nessun punteggio dipende dall'AI
<!-- AC:END -->
