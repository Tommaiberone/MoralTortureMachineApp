---
id: TASK-281
title: >-
  Pack di dilemmi 'vita quotidiana' in stile app (45 forniti + 25 nuovi,
  EN-only)
status: In Progress
assignee: []
created_date: '2026-09-08 14:03'
updated_date: '2026-09-08 14:21'
labels:
  - content
  - backend
  - frontend
  - philosophy
dependencies: []
priority: high
type: feature
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha fornito una lista classica di 45 dilemmi etici 'quotidiani' in stile quiz (rif. quiz etici da rivista/libro, formato Si/No a basso impatto: referenze, penna trovata, portafoglio, tassista ubriaco, ecc.). Riscritti/elevati nel tono e formato gia' usato in dilemmas_en.json (scenario narrativo con conseguenze reali, 2 risposte come azioni concrete, 2 tease caustici con emoji, 12 pesi dimensionali 0.0-1.0 per Empathy/Integrity/Responsibility/Justice/Altruism/Honesty), non lasciati come semplici domande Si/No. 8 esempi mostrati e approvati dall'utente in chat prima di procedere. L'utente ha scelto di aggiungere anche 25 dilemmi nuovi originali nello stesso stile/registro (vita quotidiana, non trolley/cosmico), per un totale di 70 nuovi dilemmi. Segue lo stesso precedente di TASK-201/ADR-090/ADR-091/ADR-092: EN-only (dilemmas_it.json non toccato, stessa deroga di it.json - uso IT storico <1%, app forzata English-only da TASK-101), _id nuovi a 24 char hex senza collisioni, validazione pesi/campi via script, e vanno live in produzione solo tramite il marker di commit [populate-db-append] (append-only, non distruttivo, gia' costruito in ADR-092).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Almeno 45 dilemmi derivati dalla lista fornita dall'utente, riscritti con scenario a conseguenze reali (non semplice Si/No), 2 risposte, 2 tease caustici, 12 pesi validi (0.0-1.0), aggiunti a dilemmas_en.json
- [ ] #2 Almeno 25 dilemmi nuovi originali nello stesso registro 'vita quotidiana' (non trolley/cosmico) con la stessa struttura completa, aggiunti a dilemmas_en.json
- [ ] #3 Nessun ID duplicato, nessun peso fuori range, nessun campo mancante/extra, verificato con uno script di validazione
- [ ] #4 dilemmas_it.json non viene toccato per questi nuovi dilemmi (EN-only, stessa deroga di ADR-090)
- [ ] #5 Nessuna regressione sui calcoli di archetipi e compatibilita' Duel/Party (nessuna assunzione di conteggio fisso toccata)
- [ ] #6 Contenuto pubblicato live in produzione tramite populate_dynamodb_multilang.py --append-only (marker [populate-db-append] nel commit), non lasciato solo come seed JSON morto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Duplicato accidentale di TASK-280 (creato prima nella stessa sessione, alle 13:48, prima di un cutoff per limite di token in output; la ricerca di dedup di questo task ha usato grep 'dilemma' singolare, che non ha trovato 'dilemmi' plurale nel titolo di TASK-280). Tutto il lavoro reale (bozza approvata in chat, 71 dilemmi scritti, merge in dilemmas_en.json, ADR-124) e' tracciato su TASK-280. Archiviato senza ulteriore azione.
<!-- SECTION:NOTES:END -->
