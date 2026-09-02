---
id: TASK-97.4.1
title: Scegliere e fornire la fonte quantitativa del radar di domanda
status: Done
assignee: []
created_date: '2026-07-31 09:05'
updated_date: '2026-09-02 08:09'
labels:
  - growth
  - seo
  - analytics
dependencies: []
parent_task_id: TASK-97.4
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il radar è operativo con segnali direzionali. Per stimare domanda esterna con volume occorre un export Keyword Planner per IT e US oppure l approvazione esplicita di una futura integrazione Google Ads API.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il proprietario sceglie CSV manuale o integrazione Google Ads API.
- [x] #2 Se viene scelto il CSV, un export con Keyword, Avg. monthly searches, Competition e Market viene inserito nel percorso documentato.
- [x] #3 Se viene scelta una API, costi, accessi, developer token, privacy e permessi sono valutati prima di implementarla.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisione utente 2026-09-02: nessuna azione per ora. Il radar resta con soli segnali direzionali (autocomplete, Search Console matches), senza volume quantificato da Keyword Planner CSV ne' integrazione Google Ads API - ne' il costo/complessita' di un'integrazione API ne' l'onere di un export manuale ricorrente sono giustificati al momento. AC#2/#3 non applicabili (nessuna delle due strade e' stata scelta); AC#1 soddisfatta nella sostanza - la decisione del proprietario e' stata presa, ed e' 'non ora' anziche' CSV/API. Riaprire se emerge un bisogno concreto di numeri di volume reali.
<!-- SECTION:NOTES:END -->
