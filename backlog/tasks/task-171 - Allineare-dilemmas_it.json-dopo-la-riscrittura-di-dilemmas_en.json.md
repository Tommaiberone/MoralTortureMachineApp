---
id: TASK-171
title: Allineare dilemmas_it.json dopo la riscrittura di dilemmas_en.json
status: Backlog
assignee: []
created_date: '2026-08-07 09:19'
labels:
  - content
  - i18n
  - m8-content
dependencies: []
references:
  - backend/data/dilemmas_en.json
  - backend/data/dilemmas_it.json
priority: low
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La revisione dei dilemmi EN (nuovo testo, nuovi pesi Empathy/Integrity/Responsibility/Justice/Altruism/Honesty, 12 nuovi dilemmi) non ha toccato backend/data/dilemmas_it.json. Verificato con uno script di confronto: prima della modifica i pesi EN e IT erano identici su tutti i 17 _id condivisi (0 mismatch); ora divergono su tutti e 17, e i 12 nuovi _id EN (es. 5796d7fd95764dc18b805be0, bf9dc2a6ef7b436aac2604af, ...) non esistono affatto in IT. Basso impatto oggi perche' l'app e' EN-only (TASK-101), ma se l'italiano viene riattivato, /dilemmas/by-ids e _pick_random_dilemma_base_ids con language=it non troverebbero i 12 id nuovi, e i 17 id condivisi mostrerebbero testo/pesi diversi tra le due lingue per lo stesso baseId (rompe la garanzia 'stesso dilemma' tra creator e invitee in un Duel cross-lingua).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni _id presente in dilemmas_en.json esiste anche in dilemmas_it.json, o l'esclusione e' documentata come intenzionale
- [ ] #2 I pesi dei sei tratti sono identici tra EN e IT per lo stesso _id, oppure la divergenza e' intenzionale e documentata
- [ ] #3 Il testo IT descrive lo stesso scenario/significato della versione EN aggiornata
<!-- AC:END -->
