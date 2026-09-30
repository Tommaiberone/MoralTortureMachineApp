---
id: TASK-314
title: 'Gamebook: scegliere i 100 dilemmi e i generi dei capitoli 3-10'
status: In Progress
assignee:
  - '@creativo'
created_date: '2026-09-23 14:06'
updated_date: '2026-09-30 14:13'
labels:
  - gamebook
  - decisioni
milestone: m-0
dependencies: []
priority: high
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Decisione 2026-09-30 (utente): i capitoli si raggruppano per GENERE (quotidiano, filosofico, storico, medicina, tecnologia, societa', ...), non piu' per tema morale; libro solo EN; dilemmi storici solo su eventi reali CHIUSI; i dilemmi non selezionati restano nell'app. Il catalogo ha 115 dilemmi (20 gia' nei Case File 1-2). File di lavoro: book/catalog/selection.md (audit dei 115, mappa proposta, shortlist storica). Servono ~25 dilemmi nuovi, 20 dei quali storici da verificare su fonti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mappa dei 10 capitoli per genere approvata da entrambi (book/catalog/selection.md)
- [ ] #2 Elenco finale dei 100 dilemmi (esistenti e nuovi) approvato da entrambi
- [ ] #3 Ogni dilemma storico ha almeno una fonte verificata annotata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-30: decisioni utente - capitoli per genere, EN, eventi storici chiusi (20 scelti), rivelazione dopo la scelta, massimo 2 capitoli quotidiani, non selezionati restano nell'app. Mappa in book/catalog/plan.json, PDF di revisione con node book/catalog/build-selection.mjs, ADR-159. Restano: approvare la mappa (5 argomenti proposti per i dilemmi nuovi non storici), scrivere i 20 storici con fonti (lotti da 10) e i 5 nuovi, decidere se sostituire i 4 elementi datati del capitolo 1.
<!-- SECTION:NOTES:END -->
