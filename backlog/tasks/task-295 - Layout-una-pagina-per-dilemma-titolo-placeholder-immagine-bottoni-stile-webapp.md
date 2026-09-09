---
id: TASK-295
title: >-
  Layout una pagina per dilemma: titolo, placeholder immagine, bottoni stile
  webapp
status: Done
assignee: []
created_date: '2026-09-09 14:58'
updated_date: '2026-09-09 14:59'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 191000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Su richiesta esplicita dell'utente: ogni dilemma ora occupa una pagina propria (invece di piu' dilemmi impacchettati sulla stessa pagina del Case File), con titolo proprio, un placeholder per una futura immagine, e le due risposte mostrate come due bottoni rettangolari affiancati - riprodotta la forma reale dei bottoni della webapp (frontend/src/styles/shared.css: .btn-yes/.btn-no, flex:1, border-radius:0, bordo 2px, gap 10px), non i colori (interno bianco e nero). registry.json aggiornato: ogni voce dilemma e' ora {id, title} invece di un id nudo, con titoli scritti per tutti e 10 i dilemmi dei due capitoli demo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 chapter-page inserisce un pagebreak prima di ogni dilemma - un dilemma per pagina, mai piu' di uno impacchettato insieme
- [x] #2 Ogni pagina dilemma mostra un titolo proprio (da registry.json, non piu' solo 'EXHIBIT N')
- [x] #3 Placeholder immagine bordato presente su ogni pagina dilemma
- [x] #4 Le due risposte sono due box rettangolari a bordo squadrato affiancati (grid 1fr/1fr), non piu' una lista puntata - forma verificata contro il CSS reale dei bottoni della webapp
- [x] #5 Ricompilato (16 pagine), ogni pagina ispezionata via PNG, nessun overflow, MediaBox KDP invariato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
chapter-page: pagebreak() prima di ogni entry di c.dilemmas (mai dopo l'ultima, il boundary successivo lo gestisce main.typ). exhibit-page(n,title,dilemma) sostituisce il vecchio exhibit(n,body): tag EXHIBIT N + titolo inline, image-placeholder() (box bordato con angoli a mirino, testo 'PHOTOGRAPHIC EVIDENCE - PENDING'), testo dilemma, answer-buttons(first,second) - grid 1fr/1fr gap 10pt, ogni bottone stroke:2pt angoli squadrati, tag A/B piccolo + testo risposta in grassetto centrato, verificato contro frontend/src/styles/shared.css .btn-yes/.btn-no (flex:1, border-radius:0, border 2px, .button-row gap:10px). registry.json: dilemmaIds (lista di stringhe) sostituito da dilemmas (lista di {id,title}) per tutti e 10 i dilemmi. Ricompilato: 16 pagine (era 10), MediaBox invariato 441x666pt, ogni pagina ispezionata via PNG su entrambi i capitoli (opener, primo exhibit, ultimo exhibit), nessun overflow, ToC aggiornato correttamente ai nuovi numeri di pagina (4, 10).
<!-- SECTION:NOTES:END -->
