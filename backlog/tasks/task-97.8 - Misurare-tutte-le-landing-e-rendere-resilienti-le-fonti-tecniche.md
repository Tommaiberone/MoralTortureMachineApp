---
id: TASK-97.8
title: Misurare tutte le landing e rendere resilienti le fonti tecniche
status: Done
assignee: []
created_date: '2026-07-31 09:28'
updated_date: '2026-07-31 09:32'
labels:
  - growth
  - seo
  - analytics
  - automation
  - performance
  - aso
dependencies: []
parent_task_id: TASK-97
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Misurare PageSpeed per home e sei landing, mantenere GA4 landing conversion, e ritentare errori transitori Play Vitals.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il report PageSpeed include home e le sei landing EN/IT, per mobile e desktop.
- [x] #2 Le regressioni PageSpeed indicano URL e strategia interessati.
- [x] #3 Play Vitals ritenta HTTP 429 e 5xx con backoff limitato senza bloccare il report.
<!-- AC:END -->

## Implementation Notes

Implementato 2026-07-31: `page_urls` configura home più sei landing e il report
annuncia pagina/strategia per ogni regressione. Play Vitals ritenta 429 e 5xx
fino a tre tentativi con backoff 1/2 secondi; il fallimento finale rimane
non-fatale. Coperto da test automatici.
