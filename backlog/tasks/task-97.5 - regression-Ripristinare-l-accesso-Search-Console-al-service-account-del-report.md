---
id: TASK-97.5
title: >-
  [regression] Ripristinare l accesso Search Console al service account del
  report
status: In Progress
assignee: []
created_date: '2026-07-31 09:13'
labels:
  - growth
  - seo
  - analytics
  - google
dependencies: []
parent_task_id: TASK-97
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La run completa 30619056214 del 2026-07-31 completa OIDC e le altre fonti ma Search Console risponde HTTP 403. Il proprietario ha confermato che il service account è già utente della proprietà dominio: la causa è l identificatore URL-prefix nel config invece dell identificatore API della Domain property.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il service account growth-intelligence@moraltorturemachine.iam.gserviceaccount.com è aggiunto come Utente completo o Proprietario alla proprietà dominio https://moraltorturemachine.com in Search Console.
- [x] #2 Una nuova run del report restituisce righe Search Console oppure un risultato vuoto senza errore HTTP 403.
- [x] #3 Il service account mantiene permessi minimi e non ottiene privilegi di pubblicazione del sito.
<!-- AC:END -->

## Implementation Notes

Risolto 2026-07-31 con `site_url: sc-domain:moraltorturemachine.com`.
La run GitHub Actions 30619545713 ha completato OIDC e restituito 32 righe
Search Console senza HTTP 403; il service account resta read-only.
