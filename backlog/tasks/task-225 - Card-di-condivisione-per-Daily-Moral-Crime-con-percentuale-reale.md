---
id: TASK-225
title: Card di condivisione per Daily Moral Crime con percentuale reale
status: Done
assignee: []
created_date: '2026-09-01 15:12'
updated_date: '2026-09-01 15:17'
labels:
  - growth
  - sharing
  - frontend
dependencies: []
priority: high
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Daily Moral Crime e' l'unica modalita' con un dato di popolazione reale e comparativo gia' calcolato (percentuali del voto aggregato) ma senza nessuna card visiva condivisibile (Solo/Duel/Party ce l'hanno tutte via shareCard.js). Il testo di condivisione attuale ('Today's Moral Crime is waiting. Pick a side before the crowd gets to you') e' un invito generico, non porta la percentuale reale in primo piano. Aggiungere una card canvas coerente con le altre (stessa estetica dark) con la percentuale reale come headline, e riscrivere il testo di condivisione per portarla in primo piano.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova funzione in shareCard.js (es. generateDailyCardDataUrl) che genera una card con la percentuale reale (firstPct/secondPct dal risultato gia' calcolato server-side) come elemento principale, coerente esteticamente con le altre card
- [x] #2 DailyMoralCrimeScreen usa shareOrDownloadCard (o equivalente) per il bottone Ask the Audience, stesso pattern nativo-share-poi-download delle altre modalita'
- [x] #3 Il testo di condivisione porta la percentuale reale, non solo un invito generico a votare
- [x] #4 Nessun dato inventato: solo la percentuale gia' calcolata e mostrata a schermo dopo il voto
- [x] #5 Attribuzione UTM (TASK-33) applicata anche a questo share
- [x] #6 Nuove chiavi i18n solo in en.json; pnpm lint e pnpm build:prod passano
<!-- AC:END -->
