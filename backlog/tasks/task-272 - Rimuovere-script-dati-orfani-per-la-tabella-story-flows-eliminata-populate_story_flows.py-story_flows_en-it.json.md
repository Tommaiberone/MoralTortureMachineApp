---
id: TASK-272
title: >-
  Rimuovere script/dati orfani per la tabella story-flows eliminata
  (populate_story_flows.py, story_flows_en/it.json)
status: Backlog
assignee: []
created_date: '2026-09-05 21:51'
labels:
  - chore
  - cleanup
dependencies: []
priority: low
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito di TASK-251: rimossi da deploy.yml gli step che popolavano/verificavano la tabella DynamoDB prod-moral-torture-machine-story-flows, eliminata il 2026-09-02 con TASK-185. Restano pero' nel repo backend/scripts/populate_story_flows.py, backend/data/story_flows_en.json, backend/data/story_flows_it.json, e un controllo di sintassi 'python -m py_compile scripts/populate_story_flows.py' in .github/workflows/deploy.yml riga 132 (Backend Lint & Test) - tutti ormai senza alcun consumatore reale, dato che la tabella che questo script popolava non esiste piu'. Deliberatamente non toccati in TASK-251 (il cui scope erano solo gli step di deploy.yml rotti/pericolosi, non questa pulizia a basso rischio). Verificare se le 2 righe esportate prima della cancellazione (menzionate in doc-1 riga 746) sono gia' salvate altrove prima di cancellare i JSON, dato che sarebbero l'unica copia rimasta dei dati Story Flows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Confermato che nessun codice/pipeline referenzia piu' populate_story_flows.py o story_flows_en/it.json dopo la rimozione
- [ ] #2 File rimossi (script, entrambi i JSON dati, riga py_compile in deploy.yml), oppure lasciati con motivazione esplicita se si decide di tenerli come backup
<!-- AC:END -->
