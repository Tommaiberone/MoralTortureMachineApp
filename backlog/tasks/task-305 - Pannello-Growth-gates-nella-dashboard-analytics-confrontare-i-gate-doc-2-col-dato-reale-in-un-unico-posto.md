---
id: TASK-305
title: >-
  Pannello 'Growth gates' nella dashboard analytics: confrontare i gate doc-2
  col dato reale in un unico posto
status: Done
assignee: []
created_date: '2026-09-10 19:11'
updated_date: '2026-09-10 19:13'
labels: []
dependencies: []
priority: medium
type: feature
ordinal: 206000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente (2026-09-10): la pagina analytics ha informazioni utili al growth sparse su piu' tab (funnel generico per il completamento test, tab growth per retention/viral, tab duel per l'open-to-complete) senza mai confrontarle esplicitamente con le soglie di doc-2 (Validation gates). Chi guarda la dashboard deve ricordare le soglie a memoria o aprire doc-2 in un'altra finestra.

Aggiunge un pannello 'Growth gates' in cima al tab 'growth' (che diventa il tab di default all'apertura, al posto di 'trends') con, per ciascun gate misurabile di doc-2:
- Completamento test breve (test_started -> test_completed, generic funnel) vs gate >=60%
- Result-to-share rate (gia' esposto come fromPreviousPct dello stage 'shared') vs gate >=15%
- Duel open-to-complete (moralDuel.eventFunnel, landingViewed -> completed, rapporto composto non solo tra stage consecutivi) vs gate >=25%
- D7 retention (gia' calcolato in retentionCohorts.d7) vs gate 12-15%
- North Star proxy (moralDuel 'completed' stage, conteggio identita' - etichettato esplicitamente come proxy, non conteggio esatto di sfide - vedi TASK-304 per la versione esatta)

Ogni gate mostra: valore misurato, soglia, badge di stato (superato/sotto soglia/campione insufficiente, soglia minima 30 identita' nel denominatore, stessa convenzione RETENTION_MIN_COHORT_SAMPLE gia' usata da /analytics-optimize). Tutti i dati sono gia' presenti nella risposta esistente di /admin/analytics/overview - nessuna modifica backend necessaria, solo calcolo/presentazione lato frontend (AnalyticsAdminScreen.jsx).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il tab 'growth' mostra un pannello che confronta esplicitamente ciascuno dei 4 gate misurabili di doc-2 (completamento test, result-to-share, duel open-to-complete, D7 retention) col relativo valore reale e la soglia, con badge di stato
- [x] #2 Il pannello mostra anche il proxy North Star (sfide con 2+ partecipanti, via conteggio identita' completed) etichettato chiaramente come proxy
- [x] #3 Ogni gate rispetta una soglia minima di campione (30) prima di dichiarare superato/non superato, mostrando 'campione insufficiente' altrimenti
- [x] #4 Il tab growth diventa la vista di default all'apertura della dashboard
- [x] #5 pnpm lint e pnpm build:prod puliti; nessuna modifica backend, nessun bump di versione necessario oltre quanto gia' previsto per le modifiche frontend impacchettate
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunto un pannello 'Growth gates' in cima al tab growth (ora vista di default all'apertura, al posto di trends) in AnalyticsAdminScreen.jsx: confronta esplicitamente completamento test (test_started->test_completed), result-to-share (gia' fromPreviousPct dello stage shared), duel open-to-complete (rapporto composto landingViewed->completed, non solo consecutivo) e D7 retention con le soglie di doc-2, con badge superato/sotto soglia/campione insufficiente (soglia minima 30, stessa convenzione RETENTION_MIN_COHORT_SAMPLE gia' usata da /analytics-optimize). Aggiunto anche il proxy North Star (identita' distinte che hanno completato un Duel condiviso), etichettato esplicitamente come proxy non conteggio esatto di sfide (vedi TASK-304 per la versione esatta, creata separatamente). Nessuna modifica backend: tutti i dati erano gia' nella risposta esistente di /admin/analytics/overview. pnpm lint e pnpm build:prod puliti; nessuna verifica browser dal vivo effettuata (linea guida CLAUDE.md).
<!-- SECTION:FINAL_SUMMARY:END -->
