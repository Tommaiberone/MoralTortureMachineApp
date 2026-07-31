---
id: TASK-97.3
title: Valutare prerendering delle landing SEO dopo evidenza di crawl
status: Backlog
assignee: []
created_date: '2026-07-31 08:54'
labels:
  - growth
  - seo
  - web
dependencies: []
parent_task_id: TASK-97
priority: low
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dopo almeno otto settimane, confrontare URL inviate, pagine indicizzate e copertura/crawl in Search Console per le sei landing.
- [ ] #2 Se il rendering client-side è un limite misurato, proporre una soluzione di prerendering/SSG senza nuova infrastruttura AWS o con review Free Tier esplicita.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Debito tecnico individuato durante TASK-97.2: l applicazione e una SPA. Non introdurre SSR/SSG per ipotesi; agire solo su evidenza di indicizzazione insufficiente.
<!-- SECTION:NOTES:END -->
