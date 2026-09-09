---
id: TASK-294
title: >-
  Rifinitura mini-libro: registro capitoli, bleed vero, ToC, numeri pagina,
  pagina di chiusura
status: Done
assignee: []
created_date: '2026-09-09 14:40'
updated_date: '2026-09-09 14:50'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 190000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Su richiesta esplicita dell'utente ('fai tutto questo'), implementa in blocco le proposte di miglioramento discusse dopo TASK-293: numeri di pagina, metadata PDF, controllo vedove/orfane sugli Exhibit, pagina di chiusura 'Case Closed' che riaggancia il loop verso l'app, indice, registro condiviso capitolo->dilemmi (prepara il terreno per l'AC#3 di TASK-291), script che genera tutti i QR in un colpo, bleed vero fino al bordo fisico pagina (corretta la cautela di ADR-129/130: il rischio recto/verso riguarda solo arte asimmetrica che tocca un solo bordo, non una fascia piena a larghezza intera - verificato empiricamente che page(background:) di Typst ignora i margini del corpo), varieta' dei timbri per capitolo, capolettera decorativo sull'intro di ogni capitolo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 book/chapters/registry.json e' la fonte unica capitolo->titolo/tema/timbro/slug QR/id dilemmi; chapter-XX.typ si riduce a chiamare chapter-page(key: ...)
- [x] #2 book/qr/generate_qr.py legge il registro e genera tutti i QR di tutti i capitoli con un solo comando, non piu' slug elencati a mano
- [x] #3 Numeri di pagina presenti su ogni pagina del libro compilato
- [x] #4 set document(title:, author:) presente nel PDF compilato
- [x] #5 Ogni Exhibit non si spezza tra due pagine quando evitabile
- [x] #6 Nuova pagina di chiusura con QR di ritorno al sito, spazio 'Subject #____', e testo che riaggancia il loop condivisione/confronto in app
- [x] #7 Indice con numeri di pagina reali (via label + counter(page), non hardcoded)
- [x] #8 Fascia del titolo di ogni capitolo e la title page usano bleed vero fino al bordo fisico, verificato ispezionando i pixel d'angolo del PNG renderizzato
- [x] #9 Timbro diverso per capitolo (campo nel registro), non piu' sempre 'Open'
- [x] #10 Capolettera/iniziale decorativa sull'intro di ogni capitolo
- [x] #11 Ricompilato e ogni pagina ispezionata visivamente, nessun overflow inatteso, MediaBox KDP invariato
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
registry.json unica fonte per capitolo, chapter-page(key:) legge da li'; generate_qr.py rigenera tutto dal registro con un comando. Numeri pagina via page-footer condiviso, assenti solo in title page (sfondo nero pieno). set document(title:,author:) verificato nel PDF (Title come stringa esadecimale UTF-16 per il trattino tipografico - controllato con regex piu' ampia). exhibit(...) con breakable:false. Pagina di chiusura closing.typ con Subject # e QR di ritorno. ToC con numeri di pagina reali via label + counter(page).at(...), verificato che si aggiornano correttamente quando la paginazione cambia (6->7 dopo il fix di extra-top). Bleed vero verificato empiricamente con page(background:) - corretta la cautela di ADR-129/130 (il rischio recto/verso vale solo per arte asimmetrica, non per pannelli simmetrici a piena larghezza/pagina). Bug reale trovato e risolto durante l'implementazione: lo spazio riservato per la fascia doveva vivere nel margine reale (kdp-page extra-top), non in uno spacer v() nel flusso, altrimenti la pagina 2 di un capitolo multi-pagina collideva con la fascia ripetuta (testo sovrapposto, trovato ispezionando i PNG renderizzati). Timbro per capitolo via campo registry (Open/Urgent). Capolettera lede(). Ricompilato: MediaBox invariato 441x666pt, ora 10 pagine (in piu' per via della corretta riserva di spazio, non una regressione), ogni pagina ispezionata via PNG.
<!-- SECTION:NOTES:END -->
