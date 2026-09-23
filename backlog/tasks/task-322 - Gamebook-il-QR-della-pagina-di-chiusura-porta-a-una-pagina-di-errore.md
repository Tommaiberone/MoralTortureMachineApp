---
id: TASK-322
title: 'Gamebook: il QR della pagina di chiusura porta a una pagina di errore'
status: To Do
assignee:
  - '@tommaso'
created_date: '2026-09-23 14:07'
labels:
  - gamebook
  - tecnico
milestone: m-0
dependencies: []
priority: high
ordinal: 223000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
book/typst/closing.typ stampa il QR con slug 'closing' -> moraltorturemachine.com/book/closing -> BookChapterEntryScreen chiama GET /book/chapters/closing -> 404 -> 'Case File Unavailable'. Va gestito prima della stampa (es. redirect a una pagina di confronto/home).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scansionare il QR di chiusura porta a una destinazione sensata, non a un errore
- [ ] #2 Test che copre lo slug 'closing'
<!-- AC:END -->
