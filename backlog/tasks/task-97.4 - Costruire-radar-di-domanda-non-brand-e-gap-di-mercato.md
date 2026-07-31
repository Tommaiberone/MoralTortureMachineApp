---
id: TASK-97.4
title: Costruire radar di domanda non-brand e gap di mercato
status: Done
assignee: []
created_date: '2026-07-31 09:00'
updated_date: '2026-07-31 09:05'
labels:
  - growth
  - seo
  - analytics
  - automation
dependencies: []
parent_task_id: TASK-97
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il report Growth Intelligence con una vista outside-in: idee di query e intent non ancora coperti, separando suggestioni senza volume da opportunità corroborate da Search Console o da un input di volume autorizzato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il report genera idee EN e IT a partire da seed editoriali configurati, con fonte, intent, mercato e stato coperto/non coperto.
- [x] #2 Il ranking non presenta suggerimenti come volume o domanda certa senza una fonte quantitativa; evidenza e confidenza sono esplicite.
- [x] #3 Un input CSV opzionale di Keyword Planner arricchisce volume e concorrenza senza salvare credenziali Google Ads o aggiungere un costo AWS.
- [x] #4 Il workflow schedulato resta read-only, non pubblica contenuti né modifica campagne o account Google.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato 2026-07-31: `scripts/growth_intelligence.py` raccoglie un piccolo
set di suggestion da seed EN/IT, confronta ogni frase con la copertura e con
Search Console e distingue in report `directional`, `observed` e `quantified`.
Il parser CSV opzionale non usa API Google Ads, token o credenziali. Verificati
otto test unitari, compilazione Python, esecuzione locale del collector/report
e `git diff --check`.
<!-- SECTION:NOTES:END -->
