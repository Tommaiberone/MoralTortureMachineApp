---
id: TASK-201
title: Ampliamento pool dilemmi (15 scenari diversificati)
status: Done
assignee: []
created_date: '2026-08-31 07:48'
updated_date: '2026-08-31 08:25'
labels:
  - content
  - backend
  - frontend
  - philosophy
dependencies: []
priority: high
type: feature
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
I dilemmi attuali sono eccessivamente focalizzati su sacrifici fisici diretti (varianti del trolley problem). Ampliare il catalogo con almeno 15 nuovi dilemmi ad alto impatto filosofico ed emotivo, spaziando tra: 1) IA e futuro tecnologico (allineamento, sorveglianza predittiva, mind-uploading), 2) Bioetica ed eutanasia/genetica, 3) Etica intergenerazionale e clima, 4) Doveri deontologici/sacri vs realismo utilitaristico (whistleblowing, segreti di stato), 5) Giustizia distributiva e dovere di soccorso globale. Ogni dilemma deve includere: scenario narrativo, 2 opzioni inconciliabili, 2 tease caustici, pesi 0.0-1.0 per le 6 dimensioni morali (Empathy, Integrity, Responsibility, Justice, Altruism, Honesty) in dilemmas_en.json.

Solo inglese, per decisione esplicita dell'utente (2026-08-31): coerente con la deroga it.json gia' in CLAUDE.md (uso storico IT sotto l'1%, app forzata English-only da TASK-101), dilemmas_it.json NON viene aggiornato per questi nuovi dilemmi e resta fuori sincronia, cosi' come le stringhe it.json. TASK-66 (classificazione contenuti sensibili/age gate) e' stato archiviato: i temi bioetici (eutanasia/genetica) di questo pool vanno pubblicati senza un age gate dedicato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Almeno 15 nuovi dilemmi aggiunti a dilemmas_en.json coprendo domini etici diversificati
- [x] #2 Ogni dilemma include testo, 2 risposte, 2 tease e 12 pesi dimensionali validi (0.0-1.0)
- [x] #3 Nessuna regressione sui calcoli di archetipi e compatibilita' Duel/Party
- [x] #4 dilemmas_it.json non viene toccato per questi nuovi dilemmi (EN-only per decisione esplicita)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunti 15 nuovi dilemmi a dilemmas_en.json (totale 29 -> 44), 3 per ciascuno dei 5 domini richiesti: IA/futuro tecnologico (predictive policing bias vs vite salvate, mind-uploading terminale, spegnimento di un'AI che mostra segnali di resistenza alla correzione), bioetica (eutanasia su richiesta del paziente, editing germinale, allocazione trapianti via marker genetico), etica intergenerazionale/clima (proroga centrale a carbone, geoingegneria solare, estrazione mineraria per l'ultima generazione), doveri sacri/deontologici vs utilitarismo (whistleblowing su sorveglianza illegale, segreto di stato su un'atrocita' alleata, sigillo di confessione), giustizia distributiva/dovere di soccorso globale (donazione individuale stile Singer, budget sanitario nazionale vs aiuti piu' efficaci, export di vaccini in surplus). Ogni dilemma ha scenario, 2 risposte, 2 tease caustici e i 12 pesi dimensionali (0.0-1.0) per Empathy/Integrity/Responsibility/Justice/Altruism/Honesty, validati via script Node (44 dilemmi, 0 ID duplicati, 0 pesi fuori range, 0 campi mancanti/extra). _id nuovi generati come stringhe esadecimali a 24 caratteri (openssl rand -hex 12), verificati senza collisioni con i 29 EN + 17 IT esistenti. Nessuna traduzione IT (per decisione esplicita dell'utente, vedi ADR-090); dilemmas_it.json non toccato. Nessuna regressione attesa su archetipi/compatibilita': compute_dimension_averages e archetype_engine.py non hanno assunzioni di conteggio fisso (confermato dalle note di implementazione di TASK-23), e non e' stato toccato nessun dilemma esistente. Nota operativa (ADR-091): dilemmas_en.json e' contenuto seed, non letto a runtime - il backend legge da DynamoDB (moral-torture-machine-dilemmas). I 15 nuovi dilemmi non saranno visibili ai giocatori finche' non viene eseguito populate_dynamodb_multilang.py (via il marker [populate-db] nel commit o workflow_dispatch), che cancella e ricarica l'intera tabella prod: lasciato come step esplicito da confermare con l'utente, non incluso in questo push.
<!-- SECTION:FINAL_SUMMARY:END -->
