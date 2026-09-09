---
id: TASK-292
title: >-
  Mini-libro gamebook: capitolo istruzioni + 2 capitoli d'esempio con doppio QR
  (solo/party)
status: Done
assignee: []
created_date: '2026-09-09 13:45'
updated_date: '2026-09-09 13:50'
labels: []
dependencies: []
priority: medium
type: feature
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Direzione di design scelta dall'utente per il gamebook fisico (segue lo scaffold di TASK-287): capitoli da 5 dilemmi ciascuno, raggruppati per area tematica. Ogni capitolo si apre con due QR - uno porta alla modalita' giocatore singolo (Evaluation con quei 5 dilemmi), l'altro alla modalita' party (crea una Party Room con quegli stessi 5 dilemmi). Questo task scrive un mini-libro dimostrativo: una pagina di istruzioni (in voce dossier ma funzionalmente chiara) piu' due capitoli reali, con contenuto pescato da backend/data/dilemmas_en.json (mai testo inventato). I QR restano segnaposto: la capacita' backend di aprire davvero lo stesso set fisso di 5 dilemmi via QR non esiste ancora (TASK-291, High, To Do, bloccante per il funzionamento reale del meccanismo - non per la stesura di questo contenuto).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pagina istruzioni che spiega entrambe le modalita' (solo vs party) in modo funzionalmente chiaro
- [x] #2 Due capitoli, 5 dilemmi ciascuno, ognuno con un tema coerente, contenuto pescato via _id reali da dilemmas_en.json
- [x] #3 Ogni capitolo mostra due QR distinti (solo, party) con etichette chiare della differenza tra le due modalita'
- [x] #4 Tutto compila con typst in un unico PDF (mini-libro), geometria KDP corretta, verificato aprendo/ispezionando l'output
- [x] #5 README aggiornato per riflettere la struttura capitoli/doppio QR invece del vecchio case singolo
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
chapter-page(...) sostituisce case-page(...) in template.typ (due QR - solo/party - via mode-select/qr-block, 5 Exhibit per capitolo). instructions.typ nuovo front-matter-page con spiegazione funzionale di Solo Verdict vs Convene Tribunal. Due capitoli reali in book/chapters/: The Honesty Tax (5 dilemmi su denaro trovato/nessuno guarda) e The Loyalty Clause (5 dilemmi su lealta' vs verita'), id reali letti per intero da dilemmas_en.json prima di scegliere il cluster tematico. main.typ compila title page + istruzioni + 2 capitoli in book/out/mini-book.pdf: MediaBox verificato 441x666pt=6.125x9.25in su tutte le 6 pagine, ogni pagina renderizzata in PNG e ispezionata visivamente (nessun overflow, doppio QR e Exhibit numerati corretti). README e doc-1 aggiornati alla nuova struttura chapters/ + due QR. Durante la scrittura scoperto che i QR sono ancora segnaposto non funzionali: ne' create_party_room ne' get_dilemma accettano un set di dilemma id fissato dal chiamante - TASK-291 (High, To Do) apre il lavoro backend necessario.
<!-- SECTION:NOTES:END -->
