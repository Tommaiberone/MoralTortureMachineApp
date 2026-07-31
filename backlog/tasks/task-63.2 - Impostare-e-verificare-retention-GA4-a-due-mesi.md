---
id: TASK-63.2
title: Impostare e verificare retention GA4 a due mesi
status: Done
assignee: []
created_date: '2026-07-31 08:17'
updated_date: '2026-07-31 08:31'
labels:
  - privacy
  - analytics
  - google
dependencies: []
parent_task_id: TASK-63
priority: high
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aggiorna solo event_data_retention e user_data_retention della proprietà GA4 547548324 a TWO_MONTHS.
- [x] #2 Legge e verifica i valori applicati senza modificare altre impostazioni GA4.
- [x] #3 Il workflow è eseguibile solo manualmente e non pubblica frontend o APK.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Abilitata Google Analytics Admin API, eseguito il job manuale GitHub e verificati via Admin API eventDataRetention=TWO_MONTHS e userDataRetention=TWO_MONTHS per la proprietà 547548324.
<!-- SECTION:FINAL_SUMMARY:END -->
