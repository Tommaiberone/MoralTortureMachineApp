---
id: TASK-259
title: >-
  SEO.jsx emette hreflang en+it sulla stessa URL per default, falso da quando
  l'app e' EN-only (TASK-101)
status: Done
assignee: []
created_date: '2026-09-04 15:03'
updated_date: '2026-09-05 21:40'
labels:
  - frontend
  - seo
dependencies: []
priority: medium
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente frontend growth/account): frontend/src/components/SEO.jsx:61-66, quando una pagina non passa alternateUrls (ogni screen tranne le landing SEO bilingui), il default emette sia hreflang=en sia hreflang=it puntando alla STESSA URL identica. Da quando TASK-101 ha reso il prodotto in-app EN-only, questo dice ai motori di ricerca che esiste una versione italiana di es. /about o /challenge/:token alla stessa URL, cosa non piu' vera - puo' confondere l'indicizzazione/i risultati di ricerca per query in italiano.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SEO.jsx non emette piu' hreflang=it per pagine EN-only senza una vera controparte italiana (solo le landing SEO bilingui di ADR-020 devono continuare a emettere entrambi)
<!-- AC:END -->
