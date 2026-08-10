---
id: TASK-63
title: Aggiornare Privacy Policy Terms e Data Safety
status: Blocked
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-10 14:40'
labels:
  - m9-privacy
  - legal
  - android
  - web
dependencies:
  - TASK-13
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allineare documenti e dichiarazioni a analytics, account, profili, challenge e acquisti; chiarire che i risultati sono intrattenimento.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Documenti descrivono dati, finalità e diritti
- [x] #2 Disclaimer esclude valutazione psicologica
- [ ] #3 Data Safety riflette web e Android reali
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-06: policy Privacy, Cookie e Terms riscritta e allineata al trattamento reale; aggiunta la fonte versionata growth-intelligence/data-safety.md per 1.6.4/versionCode 19. Rimane azione manuale esterna: trascrivere, verificare e inviare la dichiarazione Data Safety nel Google Play Console prima della pubblicazione. L'AC #3 resta intenzionalmente non verificato finche' la Console non e' aggiornata.

2026-08-10 Daily release: the in-app EN Privacy notice now discloses private 90-day Daily participation, post-vote non-linkable aggregates, and export/deletion treatment. This does not unblock the outstanding external Terms/Data Safety release work.
<!-- SECTION:NOTES:END -->
