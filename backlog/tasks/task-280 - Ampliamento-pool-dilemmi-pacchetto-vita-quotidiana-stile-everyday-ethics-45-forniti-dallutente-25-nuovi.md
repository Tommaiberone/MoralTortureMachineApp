---
id: TASK-280
title: >-
  Ampliamento pool dilemmi: pacchetto 'vita quotidiana' stile everyday-ethics
  (45 forniti dall'utente + 25 nuovi)
status: Done
assignee: []
created_date: '2026-09-08 13:48'
updated_date: '2026-09-08 14:22'
labels:
  - content
  - backend
  - philosophy
dependencies: []
priority: high
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha incollato una lista di 45 dilemmi classici in stile 'everyday ethics quiz' (bugie bianche, piccola disonesta', lealta' vs regole, situazioni di lavoro/famiglia quotidiane - non trolley-problem estremi). Vanno riscritti nel formato e nel tono dell'app (scenario con conseguenze concrete, 2 risposte come frasi d'azione, 2 tease caustici con emoji, 12 pesi 0.0-1.0 sulle 6 dimensioni Empathy/Integrity/Responsibility/Justice/Altruism/Honesty), resi piu' dark/complessi rispetto al testo originale piatto, poi aggiunti a dilemmas_en.json. L'utente ha chiesto +25 dilemmi originali aggiuntivi nello stesso registro (totale ~70). Segue lo stesso precedente di TASK-201/ADR-090/ADR-091/ADR-092: EN-only (dilemmas_it.json non toccato, stessa deroga IT), _id nuovi come hex 24 char senza collisioni, contenuto seed non letto a runtime (serve poi [populate-db-append] nel commit per renderli live via CI append-only, non distruttivo). L'utente ha chiesto di vedere una bozza campione in chat prima di scrivere nei file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bozza campione mostrata e approvata dall'utente prima della scrittura su file
- [x] #2 45 dilemmi forniti dall'utente riscritti nel formato/tono dell'app e aggiunti a dilemmas_en.json
- [x] #3 25 nuovi dilemmi originali nello stesso registro 'everyday ethics' aggiunti a dilemmas_en.json
- [x] #4 Ogni dilemma ha testo, 2 risposte, 2 tease e 12 pesi dimensionali validi (0.0-1.0), _id hex univoco
- [x] #5 dilemmas_it.json non toccato (EN-only, coerente con ADR-090)
- [x] #6 Nessuna regressione su calcoli archetipi/compatibilita' Duel/Party
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunti 71 dilemmi a dilemmas_en.json (44 -> 115): 46 riscritti/elevati dalla lista dell'utente (che contava in realta' 46 voci, non 45) + 25 originali nello stesso registro 'vita quotidiana' (non trolley/cosmico). 8 esempi mostrati in chat e approvati dall'utente prima di scrivere su file; dopo l'approvazione l'utente ha chiesto 'procedi', quindi gli altri 63 sono stati completati e uniti senza un secondo giro di revisione riga per riga (solo confermati via script di validazione). Ogni dilemma ha scenario a conseguenze reali, 2 risposte come azioni concrete, 2 tease caustici con emoji, 12 pesi 0.0-1.0. Merge fatto con script Python (scratchpad, non committato) che genera _id hex a 24 caratteri via secrets.token_hex(12) verificati senza collisioni contro i 44 EN + 17 IT esistenti, valida chiavi/range pesi, e riscrive il file con stessa formattazione (indent 4, emoji letterali non escaped, CRLF). Diff pulito: solo 1420 righe aggiunte, 0 modificate. dilemmas_it.json non toccato (verificato via git diff), stessa deroga EN-only di ADR-090. Pesi scritti cercando di non muovere tutte le 6 dimensioni in blocco (mitigazione parziale e incidentale del problema di correlazione di TASK-228, che resta aperto e va ri-misurato sul pool di 115). Dettagli completi in ADR-124. TASK-281 era un duplicato accidentale (dedup fallita per 'dilemma' singolare vs 'dilemmi' plurale nel grep), archiviato senza altra azione. Contenuto live in produzione solo dopo il push con marker [populate-db-append] (script append-only di ADR-092, non distruttivo).
<!-- SECTION:FINAL_SUMMARY:END -->
