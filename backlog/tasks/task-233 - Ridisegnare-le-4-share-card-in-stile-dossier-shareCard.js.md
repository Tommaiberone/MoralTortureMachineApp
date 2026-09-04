---
id: TASK-233
title: Ridisegnare le 4 share card in stile dossier (shareCard.js)
status: Done
assignee: []
created_date: '2026-09-04 10:15'
updated_date: '2026-09-04 10:31'
labels:
  - frontend
  - design
  - share-cards
dependencies: []
priority: high
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Le attuali card di condivisione (generateShareCardDataUrl/generateDuelCardDataUrl/generateDailyCardDataUrl/generatePartyRecapCardDataUrl in frontend/src/utils/shareCard.js) sono state giudicate 'brutte' dall'utente: un gradiente piatto, un bordo sottile, Courier New a ogni dimensione, nessuna texture. Direzione approvata dall'utente (2026-09-05) tramite mockup HTML/CSS pubblicato come Artifact 'Verdict Cards' (https://claude.ai/code/artifact/4ad2e427-8fd9-4343-9791-f3e8da531724): sistema 'dossier/verdetto' - coppia tipografica Special Elite (macchina da scrivere, titoli/timbri) + JetBrains Mono (dati/numeri tabellari), i 14 colori archetipo gia' esistenti usati come glow radiale dietro l'emoji invece che solo un bordo, grana pellicola procedurale, tacche di registro agli angoli, titolo 'timbrato' con leggera rotazione, footer a sigillo. Le barre statistiche (dimensioni morali, breakdown Daily) vanno implementate come etichetta+valore sopra e barra piena sotto (mai etichetta accanto a barra sulla stessa riga - la prima versione del mockup aveva le barre che coprivano il testo con quel layout, corretto nel mockup pubblicato). Bisogna caricare i due font in modo affidabile nel canvas (FontFace API + document.fonts.load, con fallback a Courier New se il caricamento fallisce/scade - il flusso di condivisione non deve mai rompersi se Google Fonts e' irraggiungibile). Sequenza concordata con l'utente: prima questa card (PNG condivisibili), poi il restyling delle schermate live di recap (task separati).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le 4 funzioni generate*CardDataUrl in shareCard.js applicano il sistema dossier approvato (font Special Elite+JetBrains Mono, glow per-archetipo, grana, tacche di registro, titolo timbrato, footer sigillo)
- [x] #2 Le barre statistiche (dimensioni Solo, breakdown Daily) usano il layout etichetta/valore-sopra + barra-sotto, mai affiancate su una riga
- [x] #3 I font vengono caricati con FontFace API + document.fonts.load prima di disegnare, con fallback deterministico a Courier New se il caricamento fallisce o scade il timeout
- [x] #4 Boilerplate condiviso (sfondo, cornice, tacche, grana, header, footer) estratto in helper riusati dalle 4 funzioni invece di duplicato 4 volte
- [x] #5 pnpm lint e pnpm build:prod passano; verifica manuale/code review poiche' non e' possibile un test automatico visivo del canvas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rewrote frontend/src/utils/shareCard.js end to end around a shared 'dossier' drawing kit (drawDossierFrame/drawDossierHeader/drawFooterSeal/drawGlow/drawStamp/drawStatBar/drawGrain), reused by all 4 generate*CardDataUrl functions instead of each duplicating its own background/border/header/footer. Fonts (Special Elite display + JetBrains Mono data) loaded lazily via a dynamically-injected Google Fonts <link> + document.fonts.load(), raced against a 1.5s timeout so sharing never blocks on/depends on Google Fonts - falls back to each font stack's own 'Courier New' on failure/timeout, same font the cards used before. All 4 generate*CardDataUrl + their 4 share wrappers (shareOrDownloadCard/shareDuelCard/shareDailyCard/sharePartyRecapCard) are now async; removed the confirmed-dead downloadShareCard export (zero callers anywhere in frontend/src). Dimension bars now use drawStatBar's label/value-above + fill-below layout (can't overlap by construction - the track is always positioned after measuring the label's actual wrapped height), also reused for the Daily choice breakdown, replacing two separate near-duplicate bar implementations. Fixed 3 issues found in code-review since canvas output can't be visually tested here: (1) Duel card's per-column glow was drawn after the 'You'/'Them' label, washing over already-drawn text - reordered so glow always draws first; (2) Duel/Daily cards kept the old fixed 1920 stories height despite much shorter new content, leaving 600-700px of dead space above the footer - given fixed, better-fitted heights (1500/1550); (3) Party recap kept a fixed 1920 (previously a fixed 1780) despite room-size-dependent content (0-5 awards, optional group archetype) - now sizes its own canvas height from the actual docket row count and hero presence before drawing, with a safe floor. Solo Archetype's 'stories' format deliberately kept at the exact 1080x1920 Instagram/WhatsApp Stories resolution (some empty space accepted) since it's the one posted to an actual Stories placement. pnpm lint and pnpm build:prod both pass.

App version bump: 1.11.0/versionCode 30 -> 1.12.0/versionCode 31 (this shareCard.js redesign touches packaged frontend code, separate change set from the previous push). versionCode raise requires explicit user confirmation before push per CLAUDE.md/ADR-017 (auto-publishes to Play Store).
<!-- SECTION:NOTES:END -->
