---
id: TASK-245
title: >-
  doc-1 afferma erroneamente che Cognito e Party Room 'non sono ancora
  deployati'
status: Done
assignee: []
created_date: '2026-09-04 15:01'
updated_date: '2026-09-05 21:53'
labels:
  - docs
dependencies: []
priority: medium
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente backend parte 2): backlog/docs/doc-1 righe ~750-751 (tabella costo/audit) affermano 'Cognito ... the project user pool is not deployed' e 'Party Room realtime | Code-complete ..., not yet deployed'. Entrambe false: Cognito con Google login e' in produzione da TASK-11/5, e questa sessione ha aggiunto email+password nativo (TASK-227) sopra un login gia' live; Party Room ha una lunga storia di fix in produzione (TASK-132, TASK-191, TASK-199, TASK-209-213). La riga su Party Room e' perfino internamente contraddittoria: la sua stessa cella 'Classification' descrive lo stack come 'gia' provisionato' nella stessa riga che dice 'not yet deployed'. doc-1 e' la fonte di verita' che ogni agente deve leggere PRIMA di implementare (protocollo pre-task CLAUDE.md): una riga sbagliata li' puo' fuorviare lavoro futuro, non e' solo un dettaglio cosmetico.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La riga Cognito nella tabella costo/audit di doc-1 riflette lo stato reale (deployato, Google+email/password)
- [x] #2 La riga Party Room nella stessa tabella riflette lo stato reale (deployato, in produzione da mesi) e non e' piu' internamente contraddittoria
<!-- AC:END -->
