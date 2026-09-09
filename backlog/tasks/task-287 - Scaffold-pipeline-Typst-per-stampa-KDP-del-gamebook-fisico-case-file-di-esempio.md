---
id: TASK-287
title: >-
  Scaffold pipeline Typst per stampa KDP del gamebook fisico (case file di
  esempio)
status: Done
assignee: []
created_date: '2026-09-09 13:28'
updated_date: '2026-09-09 13:37'
labels: []
dependencies: []
priority: low
type: task
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Setup di tooling locale, zero costo AWS/produzione, per progettare e iterare i "Case File" del gamebook fisico (idea validata via waitlist in TASK-281) verso un PDF pronto per il print-on-demand di Amazon KDP. Non e' produzione ne' commitment di stampa reale: TASK-281 inquadra esplicitamente la produzione/Kickstarter come step successivo alla validazione della domanda tramite la waitlist, che ha zero segnali misurabili ad oggi. Questo task copre solo lo scaffold del toolchain (Typst, non WeasyPrint - scelto per assenza di dipendenze native GTK/Pango/cairo problematiche su Windows, qualita tipografica di default migliore per prosa lunga, e geometria di pagina esplicita/verificabile) e un case file di esempio con contenuto reale pescato da backend/data/dilemmas_en.json (mai testo inventato/duplicato a mano, stessa fonte dell'app). Geometria KDP verificata dalle pagine ufficiali (non a memoria): bleed 0.125in sui bordi con contenuto a filo, margini che scalano col numero di pagine, trim 6x9in come default. La cartella book/ resta indipendente da CI/CD, deploy, pnpm build:prod e Terraform.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova cartella top-level book/ con config Typst per la geometria KDP (trim 6x9in, bleed 0.125in, tabella margini per pagine) verificata contro le pagine ufficiali KDP
- [x] #2 template.typ con una funzione case-page riusabile (stile dossier) invece di stile duplicato per ogni case file
- [x] #3 Un case file di esempio (case-001) che compila con typst usando contenuto reale pescato da backend/data/dilemmas_en.json via _id, non testo inventato
- [x] #4 Script che genera un QR PNG per case dallo slug (libreria pura Python, no dipendenze pesanti)
- [x] #5 typst compile produce un PDF interno valido alla dimensione di pagina KDP corretta (verificato aprendo/ispezionando il PDF generato)
- [x] #6 La pipeline non e' agganciata a CI/CD, deploy, pnpm build:prod o Terraform - verificato che nessun file esistente di build/deploy la referenzi
- [x] #7 README in book/ spiega come installare Typst e ricompilare
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Typst installato via winget. book/typst/kdp.typ (non build/, per non finire nella regola generica build/ del .gitignore di root) codifica la geometria KDP verificata dalle pagine ufficiali (bleed 0.125in solo su bordi esterni/top/bottom, margini per pagine 24-828, trim 6x9in). book/typst/template.typ definisce case-page(...) condiviso e find-dilemma(id) che legge backend/data/dilemmas_en.json via json() a compile time con assert se l'id non esiste. case-001.typ compila con 2 dilemmi reali; PDF verificato con MediaBox esatto 441x666pt = 6.125x9.25in, il numero esatto dell'esempio ufficiale KDP. QR generato con segno (venv isolato in book/.venv, non nel venv del backend). Nessun file CI/CD/build/terraform referenzia book/ (verificato via grep e git add -n). Follow-up noti non bloccanti documentati in book/README.md: il blocco QR puo sconfinare su una pagina propria per case piu lunghi, nessuna art direction dossier definitiva ancora, cover KDP fuori scope.
<!-- SECTION:NOTES:END -->
