---
id: TASK-238
title: Sostituire il font monospaced con uno piu' leggibile in tutta l'app
status: Done
assignee: []
created_date: '2026-09-04 12:16'
updated_date: '2026-09-04 12:27'
labels:
  - frontend
  - design
  - typography
dependencies: []
priority: high
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'intero frontend (shared.css, horrorTheme.css, e ogni CSS di schermata - 14 file, 76 occorrenze) usa 'Courier New', Courier, monospace come font-family, incluso il nuovo sistema dossier delle share card (TASK-233, Special Elite + JetBrains Mono - entrambi monospaced/typewriter). L'utente lo giudica poco leggibile e chiede di rimuoverlo ovunque, sostituendolo con un font unico piu' leggibile. Scelta: IBM Plex Sans (Google Fonts) - alta leggibilita' a dimensioni piccole, personalita' tecnica/istituzionale coerente col tono 'caso/dossier' del prodotto, gamma di pesi 400-700 sufficiente per titoli/corpo/bottoni senza bisogno di una seconda famiglia. Consolidare le 76 occorrenze letterali in una singola CSS custom property (--font-family in horrorTheme.css :root) invece di limitarsi a sostituire il valore in ogni punto, per non ricreare la stessa duplicazione con un valore diverso (convenzione reuse-and-unify, TASK-214/ADR-095). shareCard.js (canvas, non CSS) va aggiornato separatamente con lo stesso font.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nessuna occorrenza di 'Courier New' rimane in frontend/src (CSS o shareCard.js)
- [x] #2 Un'unica CSS custom property definisce il font, referenziata ovunque invece di ripetere il font stack letterale in ogni regola
- [x] #3 shareCard.js usa lo stesso font (o una sua variante di peso) al posto di Special Elite/JetBrains Mono
- [x] #4 -webkit-font-smoothing riportato ad un rendering leggibile standard invece di 'none' (che forzava un aspetto volutamente sgranato, pensato per il vecchio font monospace)
- [x] #5 pnpm lint e pnpm build:prod passano; nessun controllo browser live, verificato via code review
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added --font-family (IBM Plex Sans, Google Fonts, weights 400-700 loaded eagerly via <link> in index.html since it's now the whole app's font, not lazy like share-card-only fonts) to horrorTheme.css :root. Replaced all 76 literal 'Courier New' font-stack occurrences across 14 CSS files with var(--font-family) via a scripted find-replace (verified the exact 2 literal string variants first, then confirmed zero remaining occurrences). Fixed -webkit-font-smoothing: none -> antialiased in BOTH index.css (:root) and App.css (body) - the body rule is more specific and was silently winning the cascade, so fixing only :root would have had no visible effect. shareCard.js (TASK-233's canvas dossier cards) switched from Special Elite+JetBrains Mono to the same IBM Plex Sans at two weights (700 bold for stamps/headlines via drawStamp, 400 for body/data) instead of two separate typewriter/monospace typefaces - simplified its own font-loading code to just wait on the already-globally-linked stylesheet instead of injecting a second one. Left one genuinely different case alone: AnalyticsAdminScreen.css's ui-monospace stack on a raw-detail-value <dd> in the internal /admin/analytics dashboard - a different, already-non-Courier-New font stack, appropriate monospace use for tabular/raw data in an internal tool, not part of the consumer game experience the readability complaint was about. Backend full suite 198/198 (unaffected, frontend-only change); pnpm lint and pnpm build:prod pass.

App version bump: 1.12.0/versionCode 31 -> 1.13.0/versionCode 32 (covers both TASK-238 and TASK-239, packaged frontend code). versionCode raise requires explicit user confirmation before push per CLAUDE.md/ADR-017 (auto-publishes to Play Store).
<!-- SECTION:NOTES:END -->
