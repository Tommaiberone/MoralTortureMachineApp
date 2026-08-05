---
id: TASK-141
title: >-
  Titoli lunghi nei task Backlog.md rompono backlog task edit su Windows
  (ENAMETOOLONG)
status: Done
assignee: []
created_date: '2026-08-05 08:45'
updated_date: '2026-08-05 18:54'
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
- [x] #2 Valutata una soluzione permanente (es. troncare il nome file generato da backlog task create, o rinominare preventivamente i task esistenti con filename a rischio come TASK-112) o deciso esplicitamente di continuare a risolvere caso per caso
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deciso: non e' possibile troncare il filename alla generazione perche' 'backlog task create' e' un tool npm globale esterno (backlog.md@1.49.3, non vendored in questo repo) - patcharlo sarebbe sproporzionato per una quirk specifica di Windows. Rinominato preventivamente TASK-112 (255 caratteri di path assoluto, il candidato piu' a rischio nominato in questo task) a task-112.md, verificato che 'backlog task 112' e 'backlog task list' continuano a risolverlo correttamente per id. TASK-166/167 (create in questa sessione, 204-205 caratteri) restano con il titolo completo nel filename: sotto la soglia ~230+ caratteri osservata rompersi in precedenza, quindi non a rischio immediato. Decisione esplicita per il futuro: continuare a risolvere caso per caso (nessuna automazione possibile lato repo), rinominando proattivamente a task-N.md qualunque nuovo file che superi grossolanamente i 230 caratteri di path assoluto invece di aspettare che si rompa al primo edit.
<!-- SECTION:NOTES:END -->
