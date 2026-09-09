---
id: TASK-288
title: >-
  deploy.yml non ha path filter: un push docs/backlog/book-only triggera
  comunque un deploy completo
status: Backlog
assignee: []
created_date: '2026-09-09 13:38'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 184000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scoperto mentre si pushava TASK-287 (scaffold book/, tocca solo backlog/docs, backlog/decisions, backlog/tasks e la nuova cartella book/ - nessun file frontend/backend/terraform). .github/workflows/deploy.yml si attiva su ogni push a main senza alcun filtro paths, quindi anche un push che non cambia nulla di deployabile innesca comunque l'intera pipeline di deploy backend+frontend. Nessun impatto di correttezza (il deploy di codice invariato e' un no-op), ma spreco di minuti CI e rumore nelle notifiche/log ad ogni commit di sola documentazione.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Valutare se aggiungere un blocco paths/paths-ignore al trigger push di deploy.yml che escluda backlog/**, book/**, *.md di root, senza rompere il deploy per commit misti (codice + docs nello stesso push devono continuare a deployare)
- [ ] #2 Se implementato, verificato con un push di sola documentazione che il workflow non parta, e con un push che tocca anche frontend/backend che parta normalmente
<!-- AC:END -->
