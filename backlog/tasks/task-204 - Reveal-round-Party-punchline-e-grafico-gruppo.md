---
id: TASK-204
title: 'Reveal round Party: punchline e grafico gruppo'
status: Done
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 09:47'
labels:
  - frontend
  - party-room
  - ux
dependencies:
  - TASK-202
priority: medium
type: enhancement
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migliorare la schermata di reveal inter-round in Party Room aggiungendo le due cose non ancora coperte da TASK-123 (Done, 2026-08-02), che ha gia' consegnato: testo del dilemma visibile durante il reveal, elenco di chi ha votato cosa per nome (roundVotes), testo reattivo allo split del voto + badge 'il piu' diviso finora', e il richiamo della dimensione morale testata. Restano da aggiungere: 1) La punchline caustica (teaseOption1 / teaseOption2) associata alla scelta dell'utente (o alle opzioni votate dal gruppo), con l'ironia tagliente del gioco. 2) Sostituire la semplice barra (party-reveal-bar/party-reveal-first) con un grafico a torta/ciambella (Recharts Donut/Pie) con percentuali esplicite calcolate sul campione dei partecipanti della stanza (es. 67% vs 33%).

Dipende da TASK-202: il nuovo pie/donut deve usare le variabili di palette neutra introdotte li', non i colori rosso/verde attuali della barra.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La schermata di reveal mostra la punchline/tease caustica post-voto per il round
- [x] #2 Viene mostrato un grafico a percentuali chiare (Pie/Donut) al posto della barra attuale, basato sui voti del gruppo, con la palette neutra di TASK-202
- [x] #3 Layout responsive e leggibile sia su mobile che desktop
- [x] #4 Nessuna regressione sugli elementi gia' consegnati da TASK-123 (testo dilemma visibile, elenco votanti per nome, dimensione morale richiamata)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Punchline: aggiunta room.currentDilemma.teaseOption1/teaseOption2 (gia' presenti nella risposta GET /party-rooms/{code}, nessuna modifica backend necessaria - il dilemma item viene restituito senza filtraggio campi) mostrata legata al voto del CHIAMANTE (room.roundVotes.find(v => v.isCaller)), stesso pattern personalizzato di Solo Evaluation invece che al voto di maggioranza del gruppo. Grafico: sostituita .party-reveal-bar/.party-reveal-first con un Recharts Pie (stesso pattern RADIAN/renderPieLabel gia' duplicato in EvaluationDilemmasScreen.jsx/ChallengeLandingScreen.jsx per coerenza col resto della codebase, nessuna estrazione in util condivisa dato che non e' mai stata la convenzione qui), percentuali esplicite via label, colori var(--choice-a)/var(--choice-b) di TASK-202, legend con i testi reali delle due risposte. Mantenuta anche la riga testuale 'X vs Y' (revealSplit) come riepilogo numerico complementare alle percentuali. Rimossa la variabile 'total' ora inutilizzata insieme alla vecchia barra. Nessuna regressione: testo dilemma, elenco votanti per nome e dimensione morale testata restano tutti presenti e invariati (solo la barra e' stata sostituita). Layout responsive: outerRadius e font della legend/label si adattano sotto i 480px, stesso breakpoint gia' usato da EvaluationDilemmasScreen. pnpm lint e pnpm build:prod puliti.

Version bump: 1.7.2 -> 1.7.3, versionCode 22 -> 23 (packaged web code changed).
<!-- SECTION:FINAL_SUMMARY:END -->
