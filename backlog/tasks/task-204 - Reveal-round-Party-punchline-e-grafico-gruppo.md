---
id: TASK-204
title: 'Reveal round Party: punchline e grafico gruppo'
status: To Do
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 08:05'
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
- [ ] #1 La schermata di reveal mostra la punchline/tease caustica post-voto per il round
- [ ] #2 Viene mostrato un grafico a percentuali chiare (Pie/Donut) al posto della barra attuale, basato sui voti del gruppo, con la palette neutra di TASK-202
- [ ] #3 Layout responsive e leggibile sia su mobile che desktop
- [ ] #4 Nessuna regressione sugli elementi gia' consegnati da TASK-123 (testo dilemma visibile, elenco votanti per nome, dimensione morale richiamata)
<!-- AC:END -->
