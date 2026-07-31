---
id: TASK-97.6
title: Aggregare Search Console e generare brief automatici dal radar
status: Done
assignee: []
created_date: '2026-07-31 09:28'
updated_date: '2026-07-31 09:32'
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
Evitare che dimensioni paese/dispositivo frammentino le soglie e convertire segnali direzionali sicuri del radar in brief di validazione, mai in pubblicazioni automatiche.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il collector conserva il drill-down ma usa un dataset Search Console aggregato per query e pagina nelle soglie.
- [x] #2 Il report genera al massimo due brief per mercato per gap current-fit confermati da autocomplete, con evidenza e istruzione di validazione prima di scrivere contenuto.
- [x] #3 Query future-fit o policy-review non generano brief automatici.
<!-- AC:END -->

## Implementation Notes

Implementato 2026-07-31: il collector esegue query/page/device/country e una
seconda query/page aggregata; le soglie e il radar usano la seconda. I brief
richiedono `current` fit, gap, autocomplete e nessun rischio policy, sono
limitati a due per mercato e dicono esplicitamente di validare prima di
scrivere. Coperto da test automatici.
