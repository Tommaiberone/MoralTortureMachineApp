---
id: TASK-141
title: >-
  Titoli lunghi nei task Backlog.md rompono backlog task edit su Windows
  (ENAMETOOLONG)
status: To Do
assignee: []
created_date: '2026-08-05 08:45'
updated_date: '2026-08-05 08:45'
labels:
  - technical-debt
  - tooling
dependencies: []
priority: low
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog task create deriva il nome file dal titolo completo del task senza troncarlo. Su Windows, quando il path completo (repo + backlog/tasks/ + nome file + suffisso .tmp.<pid>.<random> usato dalla scrittura atomica) supera ~260 caratteri, sia 'backlog task edit' sia il tool Write di Claude Code falliscono con ENAMETOOLONG - la lettura invece funziona sempre, quindi il problema si nota solo al primo tentativo di modifica. Riscontrato su TASK-109/110/111 (title-only task lunghi, filename 173-234 caratteri), risolto rinominando il solo file .md a 'task-N.md' (es. task-110.md) lasciando id/titolo invariati nel frontmatter YAML - backlog CLI risolve i task per 'id', non per nome file, quindi il rename e' sicuro e trasparente (verificato con backlog task list e backlog board dopo il rename). TASK-112 (180 caratteri) e' il prossimo candidato a rompersi se editato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Documentato il workaround (rinominare il file .md a task-N.md quando l'edit fallisce con ENAMETOOLONG) cosi' le prossime sessioni non restano bloccate
- [ ] #2 Valutata una soluzione permanente (es. troncare il nome file generato da backlog task create, o rinominare preventivamente i task esistenti con filename a rischio come TASK-112) o deciso esplicitamente di continuare a risolvere caso per caso
<!-- AC:END -->
