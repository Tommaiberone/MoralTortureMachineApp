---
id: TASK-371
title: >-
  Portare in produzione le correzioni al pool dilemmi (scambio contatori voti,
  archetypesVersion)
status: To Do
assignee: []
created_date: '2026-09-30 13:55'
updated_date: '2026-09-30 14:03'
labels:
  - content
  - gamebook
  - tecnico
  - archetypes
dependencies:
  - TASK-372
priority: high
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Le correzioni di ordine risposte/punteggi/etichette in dilemmas_en.json (task sui bias) non raggiungono i giocatori finche' non vengono scritte in DynamoDB. Servono: il percorso di aggiornamento non distruttivo (TASK-323; --append-only non modifica gli esistenti e la modalita' completa svuota la tabella), lo scambio di yesCount/noCount per ogni dilemma con risposte invertite (altrimenti la torta dei voti mostra le percentuali sulla risposta sbagliata), e la decisione sul bump di archetypesVersion (ADR-025) perche' i punteggi cambiano gli archetipi assegnati. Nota: dilemmas_it.json ha solo 17 dilemmi e non viene toccato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Percorso di aggiornamento in-place applicato solo ai dilemmi modificati, senza cancellazioni
- [ ] #2 Per ogni dilemma con risposte invertite yesCount e noCount vengono scambiati nella stessa operazione
- [ ] #3 Deciso e applicato (o escluso con motivazione) il bump di archetypesVersion prima del deploy
- [ ] #4 Verificato in produzione su un dilemma di prova che testo, ordine, punteggi e percentuali dei voti coincidono con il JSON
<!-- AC:END -->
