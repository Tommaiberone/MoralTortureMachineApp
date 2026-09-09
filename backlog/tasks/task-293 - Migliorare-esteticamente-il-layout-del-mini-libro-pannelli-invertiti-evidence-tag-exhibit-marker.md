---
id: TASK-293
title: >-
  Migliorare esteticamente il layout del mini-libro (pannelli invertiti,
  evidence tag, exhibit marker)
status: Done
assignee: []
created_date: '2026-09-09 13:59'
updated_date: '2026-09-09 14:00'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 189000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Su richiesta esplicita dell'utente dopo aver visto il mini-libro di TASK-292 ('per ora e' un po' scarno'), confermato interno bianco e nero per KDP. Il B&W di KDP stampa comunque grigi/nero pieno via retinatura (halftone), non e' 1-bit puro - quindi via libera a pannelli invertiti e riempimenti pieni senza costi aggiuntivi noti. Deliberatamente NON tentato il bleed vero fino al bordo fisico pagina: con margini a specchio (binding: left, inside/outside) servirebbe sapere per ogni pagina se e' recto o verso per calcolare l'offset corretto, e sbagliarlo disallineerebbe l'arte al taglio in una stampa reale - rimandato a una fase successiva verificata, non fatto a meta'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 case-band(...): pannello invertito (bianco su nero) a larghezza contenuto per l'header di ogni capitolo e delle pagine di front-matter, non piu' testo semplice
- [x] #2 evidence-tag(...): le card QR hanno bordo, tag identificativo, e styling coerente (sostituisce il vecchio qr-block semplice)
- [x] #3 exhibit(...): ogni dilemma ha un tag invertito EXHIBIT N con riga verticale a margine, non piu' una riga sottile di separazione
- [x] #4 instructions.typ: Solo Verdict/Convene Tribunal diventano due pannelli bordati affiancati (procedure-panel), non piu' testo semplice in sequenza
- [x] #5 main.typ: title page con pannello nero pieno a larghezza contenuto e testo invertito, non piu' solo testo centrato
- [x] #6 Ricompilato e verificato visivamente pagina per pagina (6 pagine, nessun overflow, MediaBox KDP invariato)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
case-band/evidence-tag/exhibit/stamp aggiunti a template.typ; procedure-panel locale in instructions.typ; title page in main.typ riscritta con blocco nero pieno. Ricompilato: MediaBox invariato 441x666pt=6.125x9.25in, 6 pagine (nessun overflow), ogni pagina renderizzata in PNG e ispezionata. Bleed vero fino al bordo fisico deliberatamente rimandato (vedi descrizione) - tutti i pannelli invertiti sono a larghezza contenuto, non bleed reale.
<!-- SECTION:NOTES:END -->
