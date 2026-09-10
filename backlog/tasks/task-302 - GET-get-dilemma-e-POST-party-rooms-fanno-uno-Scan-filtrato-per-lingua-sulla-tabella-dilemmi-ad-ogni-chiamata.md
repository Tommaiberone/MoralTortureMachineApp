---
id: TASK-302
title: >-
  GET /get-dilemma e POST /party-rooms fanno uno Scan filtrato per lingua sulla
  tabella dilemmi ad ogni chiamata
status: Backlog
assignee: []
created_date: '2026-09-10 19:10'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 203000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante lo stesso audit di TASK-301 (stesso pattern architetturale di TASK-300/ADR-137, gravita' minore).

GET /get-dilemma (backend_fastapi.py ~6212, probabilmente l'endpoint piu' chiamato dell'app - core gameplay) e _pick_random_dilemma_base_ids usata da POST /party-rooms (~3141) fanno uno Scan filtrato per lingua sulla tabella dilemmi (DYNAMODB_TABLE) invece di una Query indicizzata.

A differenza di TASK-300/TASK-301, la tabella dilemmi e' un catalogo curato piccolo (~115 item in inglese, dati sorgente in backend/data/dilemmas_en.json) che cresce solo manualmente/lentamente, non per-utente - quindi il rischio di crescita illimitata verso un timeout NON esiste come per user_analytics/product_events/users_table. Resta pero' uno spreco di RCU/latenza non necessario sull'hot path piu' trafficato dell'app.

Priorita' Backlog/Media: non urgente (nessun rischio di timeout dato il volume limitato e stabile), ma un candidato naturale per una Query su una GSI per lingua se mai si tocca quell'area per altri motivi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /get-dilemma e POST /party-rooms leggono i dilemmi per lingua tramite una Query indicizzata invece di uno Scan filtrato, oppure la decisione di non farlo (dato il volume stabile) viene registrata esplicitamente come accettata
<!-- AC:END -->
