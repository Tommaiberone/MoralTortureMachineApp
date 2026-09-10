---
id: TASK-302
title: >-
  GET /get-dilemma e POST /party-rooms fanno uno Scan filtrato per lingua sulla
  tabella dilemmi ad ogni chiamata
status: Done
assignee: []
created_date: '2026-09-10 19:10'
updated_date: '2026-09-10 19:45'
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
- [x] #1 GET /get-dilemma e POST /party-rooms leggono i dilemmi per lingua tramite una Query indicizzata invece di uno Scan filtrato, oppure la decisione di non farlo (dato il volume stabile) viene registrata esplicitamente come accettata
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta una GSI LanguageIndex (hash language) sulla tabella dilemmi (gia' PAY_PER_REQUEST, nessuna capacity da pianificare). GET /get-dilemma e _pick_random_dilemma_base_ids ora usano _query_all invece di uno Scan. Scoperto durante il fix un problema piu' serio della sola performance: nessuna delle due chiamate paginava oltre la prima pagina di table.scan() - a questo volume (~115 dilemmi EN) probabilmente innocuo, ma un catalogo cresciuto oltre ~1MB per Scan avrebbe silenziosamente perso dilemmi senza alcun errore. _query_all pagina correttamente. Il filtro attribute_exists(#lang) originale e' ora implicito nella sparsita' della GSI. Verificato con 7 nuovi test dedicati (query non scan, paginazione multi-pagina, reset pool, 404) + il mock esistente di test_party_room.py aggiornato; tutti i 264 test del backend passano.
<!-- SECTION:FINAL_SUMMARY:END -->
