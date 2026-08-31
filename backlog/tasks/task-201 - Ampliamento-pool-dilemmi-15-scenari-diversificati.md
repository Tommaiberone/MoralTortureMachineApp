---
id: TASK-201
title: Ampliamento pool dilemmi (15 scenari diversificati)
status: To Do
assignee: []
created_date: '2026-08-31 07:48'
updated_date: '2026-08-31 08:05'
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
- [ ] #1 Almeno 15 nuovi dilemmi aggiunti a dilemmas_en.json coprendo domini etici diversificati
- [ ] #2 Ogni dilemma include testo, 2 risposte, 2 tease e 12 pesi dimensionali validi (0.0-1.0)
- [ ] #3 Nessuna regressione sui calcoli di archetipi e compatibilita' Duel/Party
- [ ] #4 dilemmas_it.json non viene toccato per questi nuovi dilemmi (EN-only per decisione esplicita)
<!-- AC:END -->
