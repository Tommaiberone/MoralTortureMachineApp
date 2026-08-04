---
id: TASK-133
title: Arricchire la card di condivisione del risultato singolo
status: Done
assignee: []
created_date: '2026-08-04 09:39'
updated_date: '2026-08-04 10:56'
labels:
  - m3-profiles
  - sharing
  - growth
  - frontend
dependencies:
  - TASK-31
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Oggi generateShareCardDataUrl (shareCard.js) mostra solo emoji+nome+sharePhrase: nessun dato reale. L'archetipo ha gia' strength e blindSpot (gia' usati in ResultsScreen.jsx ma mai nella card) e i punteggi per dimensione per un mini radar/barre. Rendere la card un mini-profilo informativo invece di un'etichetta vuota, mantenendo l'approccio canvas client-side senza AI/round-trip.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La card mostra un mini grafico/barre delle 6 dimensioni oltre a nome/emoji
- [x] #2 La card include strength e blindSpot dell'archetipo
- [x] #3 IT ed EN non causano overflow, coerente con TASK-31
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato: generateShareCardDataUrl (shareCard.js) accetta ora un array dimensions opzionale e disegna un mini bar chart delle 6 dimensioni piu' le righe strength/blindSpot, oltre a emoji+nome+sharePhrase gia' esistenti. ResultsScreen.jsx passa 'data' (gia' calcolato per il radar chart) alle due chiamate shareOrDownloadCard esistenti (stories/square). Nessuna chiamata AI/server aggiuntiva, canvas client-side come prima. pnpm lint + build:prod puliti. Verifica visiva in browser reale NON eseguita (regola CLAUDE.md no-browser-automation).
<!-- SECTION:NOTES:END -->
