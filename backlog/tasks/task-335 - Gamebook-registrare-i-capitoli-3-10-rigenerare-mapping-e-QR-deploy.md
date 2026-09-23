---
id: TASK-335
title: 'Gamebook: registrare i capitoli 3-10, rigenerare mapping e QR, deploy'
status: To Do
assignee:
  - '@tommaso'
created_date: '2026-09-23 14:08'
labels:
  - gamebook
  - tecnico
milestone: m-1
dependencies:
  - TASK-327
  - TASK-328
  - TASK-329
  - TASK-330
  - TASK-331
  - TASK-332
  - TASK-333
  - TASK-334
priority: high
ordinal: 236000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eseguire book/qr/generate_qr.py, committare backend/data/gamebook_chapters.json rigenerato, aggiungere i file chapter-03..10.typ e main.typ, deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tutti i 20 QR di capitolo risolvono in produzione
- [ ] #2 Libro compila senza errori
<!-- AC:END -->
