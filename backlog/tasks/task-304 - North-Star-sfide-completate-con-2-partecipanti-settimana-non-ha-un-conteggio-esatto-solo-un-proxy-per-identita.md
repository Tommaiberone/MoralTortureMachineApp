---
id: TASK-304
title: >-
  North Star (sfide completate con 2+ partecipanti/settimana) non ha un
  conteggio esatto, solo un proxy per-identita'
status: Backlog
assignee: []
created_date: '2026-09-10 19:11'
labels: []
dependencies: []
priority: low
type: enhancement
ordinal: 205000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
doc-2 definisce la North Star Metric come 'completed challenges with at least two participants per week' - un conteggio di SFIDE, non di persone. L'analytics attuale (moralDuel.eventFunnel, stage 'completed') conta identita' DISTINTE che hanno raggiunto lo stage completed, non sfide distinte - un proxy ragionevole (~meta' del numero di identita' completed, dato che ogni sfida completata coinvolge 2 identita') ma non un conteggio esatto, e sottostima se la stessa persona completa piu' sfide nel periodo (viene contata una volta sola per via della deduplica a Set).

Un conteggio esatto richiederebbe tracciare l'evento 'una sfida specifica ha raggiunto lo stato completed' lato server, SENZA pero' violare il principio gia' stabilito (TASK-200/ADR) che challenge_token resta escluso dagli analytics - la soluzione e' un contatore write-time non identificante (stesso pattern di TASK-300.1: un contatore scalare 'duelCompletedChallenges' per giorno, incrementato una volta per sfida al momento in cui il backend rileva la transizione a completed - non per identita', non legato al token) invece di derivarlo dagli eventi client.

Questo e' stato aggiunto nella sessione TASK-300.x del 2026-09-10 mentre si migliorava la pagina analytics per il growth (vedi anche TASK-303, l'altro gate doc-2 non ancora tracciato con precisione). Priorita' bassa: il proxy attuale (esposto nel pannello Growth gates, TASK-304) e' etichettato esplicitamente come proxy, non come numero esatto, quindi non c'e' urgenza, ma vale la pena chiuderlo quando si tocca di nuovo il backend Duel.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Esiste un contatore write-time non identificante che conta le sfide (non le identita') che hanno raggiunto lo stato completed per giorno, senza mai memorizzare o esporre il challenge_token
- [ ] #2 Il pannello Growth gates della dashboard mostra il conteggio esatto invece del proxy per-identita', o entrambi con etichette chiare
<!-- AC:END -->
