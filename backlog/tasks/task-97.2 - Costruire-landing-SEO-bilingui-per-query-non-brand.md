---
id: TASK-97.2
title: Costruire landing SEO bilingui per query non-brand
status: Done
assignee: []
created_date: '2026-07-31 08:45'
updated_date: '2026-08-06 10:01'
labels:
  - growth
  - seo
  - web
  - content
dependencies: []
parent_task_id: TASK-97
priority: high
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pubblica landing EN e IT per moral dilemma test, ethical dilemmas e moral dilemma game, con contenuto originale, FAQ e CTA al gioco.
- [x] #2 Ogni landing dichiara canonical e hreflang distinti; sitemap e link interni espongono le sei URL ai crawler.
- [x] #3 La home associa chiaramente il prodotto alle query non-brand senza compromettere il loop anonimo o la modalità Pass the Phone.
- [x] #4 Nessuna pagina è una lista generata/scalata di keyword o usa promesse psicologiche non dimostrabili.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato 2026-07-31 e verificato con build/lint: le sei landing sono
pronte nel bundle web, con contenuto editoriale originale, FAQ visibili,
CTA verso il flusso anonimo esistente, canonical/hreflang reciproci, JSON-LD,
sitemap e link dalla home. #1 sarà completato al deploy del frontend: nessuna
pubblicazione è stata eseguita in questa attività perché non è stata richiesta
esplicitamente.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementazione, lint e build erano gia verificati. Il 2026-08-06 il proprietario ha verificato manualmente in produzione tutte e sei le landing EN/IT: pagina visibile, FAQ e CTA verso il gioco anonimo funzionanti.
<!-- SECTION:FINAL_SUMMARY:END -->
