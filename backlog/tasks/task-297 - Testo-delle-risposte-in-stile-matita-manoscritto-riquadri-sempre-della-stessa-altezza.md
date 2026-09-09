---
id: TASK-297
title: >-
  Testo delle risposte in stile matita/manoscritto, riquadri sempre della stessa
  altezza
status: Done
assignee: []
created_date: '2026-09-09 15:08'
updated_date: '2026-09-09 15:10'
labels: []
dependencies: []
priority: low
type: task
ordinal: 193000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Su richiesta esplicita dell'utente: il testo delle due risposte deve sembrare scritto a matita, e i due riquadri devono essere sempre della stessa altezza (anche quando una risposta va a capo e l'altra no). Scaricato Shadows Into Light (Google Fonts, licenza OFL - stessa regola di embeddability seguita per tutti gli altri font del libro, mai un font Windows commerciale) in book/fonts/, con il file OFL.txt della licenza accanto. Il tag A/B resta nel mono font sistematico, solo il testo della risposta usa il font a matita. Per l'altezza uguale, il primo tentativo (box con height:100% dentro la cella della griglia) ha fatto esplodere l'impaginazione da 16 a 26 pagine - il 100% si risolve contro lo spazio disponibile della pagina in un contesto di flusso auto-sized, non contro l'altezza della riga della griglia. Corretto usando grid.cell(stroke:...) invece di box, che disegna il bordo contro l'area reale assegnata alla cella (gia' dimensionata dalla griglia al contenuto piu' alto della riga).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 answer-buttons usa un font manoscritto OFL scaricato e verificato (non un font Windows commerciale) solo per il testo della risposta
- [x] #2 book/fonts/ contiene il file .ttf e il relativo file di licenza OFL, versionati nel repo
- [x] #3 I due riquadri di ogni pagina dilemma hanno sempre la stessa altezza, verificato visivamente su un caso dove le due risposte hanno lunghezza diversa
- [x] #4 Compilazione richiede ora --font-path book/fonts, documentato in README e nella config di editor
- [x] #5 Ricompilato (16 pagine, non piu' 26), MediaBox KDP invariato, verificato su piu' pagine
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shadows Into Light (OFL, Google Fonts google/fonts repo) scaricato in book/fonts/ con OFL.txt. answer-button-content usa font DejaVu Sans Mono per il tag A/B e Shadows Into (nome interno del font, senza 'Light') a 15pt per il testo risposta. Primo tentativo con box(height:100%) dentro la cella della griglia ha fatto esplodere l'impaginazione 16->26 pagine (100% risolto contro lo spazio pagina disponibile, non contro la riga); corretto con grid.cell(stroke:2pt, inset:0.9em, ...) che disegna contro l'area reale della cella gia' dimensionata dalla griglia al contenuto piu' alto. .vscode/settings.json aggiornato con tinymist.fontPaths (resta locale/gitignored come rootPath). README aggiornato con --font-path book/fonts nei comandi di build e nuova sezione 'Editor setup'. Ricompilato: 16 pagine, MediaBox invariato 441x666pt, verificato su piu' pagine di entrambi i capitoli che i due riquadri abbiano sempre la stessa altezza anche con risposte di lunghezza diversa.
<!-- SECTION:NOTES:END -->
