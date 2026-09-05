---
id: TASK-246
title: >-
  GET /health fa leak di testo grezzo delle eccezioni a chiamanti non
  autenticati
status: Done
assignee: []
created_date: '2026-09-04 15:01'
updated_date: '2026-09-05 21:45'
labels:
  - backend
  - security
dependencies: []
priority: high
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente backend parte 1): backend/src/backend_fastapi.py:3639-3698 (GET /health). Ogni controllo di dipendenza (dynamodb_dilemmas, dynamodb_analytics, dynamodb_product_events, dynamodb_daily_moral_crime, ssm_parameter) mette f"error: {e!s}" direttamente nel body JSON. L'endpoint non ha require_analytics_admin ne' altro gate di autenticazione, e non ha una regola di rate-limit dedicata (ricade sul bucket generico 'global'). Verificato via diff del commit a39bf9a (fix TASK-186): quel fix ha ripulito /vote, /get-dilemma, /generate-dilemma, /analyze-results e il dead status code di /health, ma MAI il leak di testo delle eccezioni dentro /health stesso - non e' un duplicato di TASK-186, e' un gap che quel fix non ha coperto. Chiunque su internet puo' chiamare /health e potenzialmente vedere stringhe di errore boto3/AWS grezze (es. permessi IAM negati che nominano risorse specifiche).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GET /health non restituisce piu' testo grezzo di eccezione nel body - solo uno stato ok/degraded per dipendenza, mai str(e)
- [x] #2 Valutato se /health necessita di un rate-limit dedicato invece del bucket generico 'global', dato che e' pubblico e potenzialmente costoso da martellare
<!-- AC:END -->
