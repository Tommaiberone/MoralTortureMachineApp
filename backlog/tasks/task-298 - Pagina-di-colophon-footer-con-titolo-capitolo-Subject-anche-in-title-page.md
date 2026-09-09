---
id: TASK-298
title: 'Pagina di colophon, footer con titolo capitolo, Subject # anche in title page'
status: Done
assignee: []
created_date: '2026-09-09 15:13'
updated_date: '2026-09-09 15:13'
labels: []
dependencies: []
priority: low
type: task
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implementati i tre suggerimenti proposti dopo TASK-297 e approvati dall'utente ('Ok per i tuoi suggerimenti'): (1) nuova pagina di colophon/edizione dopo la title page (edizione, copyright, placeholder ISBN onesto - nessun ISBN reale esiste finche' non c'e' una tiratura vera, TASK-281), (2) footer dei capitoli ora mostra il titolo del capitolo oltre al numero di pagina (page-footer diventato una funzione con parametro label opzionale), (3) 'SUBJECT #___' ora presente anche in title page, non solo nella pagina di chiusura, cosi' il lettore rivendica la copia subito all'apertura invece che solo alla fine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova pagina colophon.typ con edizione/copyright/ISBN placeholder, inclusa in main.typ subito dopo la title page
- [x] #2 page-footer diventata una funzione; le pagine di capitolo mostrano titolo capitolo + numero pagina, le pagine di front/back-matter restano con solo il numero
- [x] #3 Title page mostra 'SUBJECT #___' con linea da compilare, oltre alla pagina di chiusura che gia' lo aveva
- [x] #4 Ricompilato (17 pagine), MediaBox KDP invariato, indice verificato con i nuovi numeri di pagina corretti (5, 11)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
colophon.typ: front-matter-page senza band, testo mono grigio con edizione/anno/copyright/ISBN placeholder onesto ('to be assigned at print submission'). page-footer(label: none) in template.typ: senza label mostra solo il numero (front-matter-page), con label mostra 'TITOLO --- N ---' (chapter-page passa label: c.title). Title page: SUBJECT # + linea bianca aggiunta sotto 'The Gamebook', stesso pattern della pagina di chiusura ma colori invertiti (sfondo nero). Ricompilato: 17 pagine (colophon ne aggiunge una), MediaBox invariato 441x666pt, indice verificato con i numeri aggiornati automaticamente a 5 e 11 (via il meccanismo label+counter gia' in uso, nessun hardcode).
<!-- SECTION:NOTES:END -->
