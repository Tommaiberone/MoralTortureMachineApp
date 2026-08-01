---
id: TASK-67
title: Rate limit degli endpoint costosi e abuse-prone
status: Done
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-08-01 14:36'
labels:
  - m9-privacy
  - security
  - backend
  - cost
dependencies:
  - TASK-17
documentation:
  - backlog/docs/doc-2
priority: medium
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proteggere AI, profili pubblici, challenge, report e future operazioni billing con limiti per rischio.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Limiti sono differenziati per endpoint e identità
- [x] #2 Abuso non genera costo incontrollato
- [x] #3 Risposte e osservabilità permettono diagnosi
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Il guardiano zero-cost esistente (ADR-012/017/029) copriva gia' AI (12/min), ingestione analytics (30/min) e scritture autenticate/Duel (10-15/min) con bucket dedicati sopra il limite globale (120/min), tutti con risposta 429+Retry-After e log diagnostico. Mancava un bucket per le letture pubbliche non autenticate (profili, teaser/compare challenge, lookup dilemmi per id) esplicitamente citate dal task: aggiunta la regola 'public_read' (ABUSE_PUBLIC_READ_REQUESTS_PER_MINUTE, default 60/min) per GET /profiles/*, GET /challenges/* e GET /dilemmas/by-ids in backend_fastapi.py, con la stessa risposta 429/Retry-After/log delle altre regole. 'Report' e 'operazioni billing' citati nella descrizione non hanno ancora un endpoint (dipendono da TASK-53/54/55, non fatti): andranno protetti con una loro regola quando quegli endpoint esisteranno, non prima. Aggiunte le variabili Terraform/env corrispondenti (least-privilege, nessun nuovo servizio AWS) e 2 nuovi test; l'intera suite (84 test) passa. Richiede terraform apply per avere effetto.
<!-- SECTION:FINAL_SUMMARY:END -->
