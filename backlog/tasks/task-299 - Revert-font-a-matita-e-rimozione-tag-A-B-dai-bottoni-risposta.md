---
id: TASK-299
title: Revert font a matita e rimozione tag A/B dai bottoni risposta
status: Done
assignee: []
created_date: '2026-09-09 15:21'
updated_date: '2026-09-09 15:22'
labels: []
dependencies: []
priority: low
type: task
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Su richiesta esplicita dell'utente ('La parte scritta a matita e' brutta, riportala come prima'): rimosso il font manoscritto Shadows Into Light introdotto in TASK-297, testo delle risposte tornato al grassetto Libertinus Serif originale. Rimossi anche i tag 'A'/'B' sopra ogni risposta. L'altezza uguale dei due riquadri (grid.cell, l'altra meta' di TASK-297) resta invariata - non era oggetto della lamentela. Rimosso l'asset font non piu' usato (book/fonts/ShadowsIntoLight-Regular.ttf + OFL.txt) e ogni riferimento a --font-path/tinymist.fontPaths in README e .vscode/settings.json.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 answer-button-content torna a testo grassetto semplice, nessun font manoscritto
- [x] #2 Nessun tag A/B visibile sopra le risposte
- [x] #3 book/fonts/ rimossa (asset non piu' referenziato da nessun file .typ)
- [x] #4 README e .vscode/settings.json non menzionano piu' --font-path/fontPaths
- [x] #5 Ricompilato senza --font-path (nessun warning di font mancante), 17 pagine invariate, MediaBox KDP invariato, riquadri ancora della stessa altezza
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
answer-button-content(label) semplificato a align(center, text(weight:bold, label)), rimossi parametro tag e font Shadows Into. book/fonts/ eliminata interamente (ttf + OFL.txt), nessun altro file .typ la referenziava. README: rimossi tutti i riferimenti a --font-path/fonts/Editor setup->fontPaths, sezione Editor setup ridotta a solo tinymist.rootPath. .vscode/settings.json aggiornato allo stesso modo. Ricompilato senza --font-path: nessun warning, 17 pagine invariate, MediaBox 441x666pt, verificato visivamente su piu' pagine che i riquadri restano della stessa altezza anche con risposte di lunghezza diversa.
<!-- SECTION:NOTES:END -->
