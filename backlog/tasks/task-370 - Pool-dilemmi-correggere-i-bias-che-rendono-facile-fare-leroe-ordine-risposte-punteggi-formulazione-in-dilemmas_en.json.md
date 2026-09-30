---
id: TASK-370
title: >-
  Pool dilemmi: correggere i bias che rendono facile fare l'eroe (ordine
  risposte, punteggi, formulazione) in dilemmas_en.json
status: Done
assignee: []
created_date: '2026-09-30 13:54'
updated_date: '2026-09-30 14:13'
labels:
  - content
  - gamebook
  - archetypes
dependencies: []
priority: high
ordinal: 271000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Analisi 2026-09-30 sui 115 dilemmi EN (book/catalog/bias-analysis.md): la prima risposta ha punteggio totale piu' alto in 93/115, domina tutte le dimensioni in 32, 53 dilemmi non hanno un vero trade-off, Integrity/Justice/Honesty correlano 0.84/0.84/0.67, e le etichette dell'opzione 'sbagliata' sono spesso caricate. Correggere in dilemmas_en.json (no produzione: quella e' il task di rollout). Deciso dall'utente: le correzioni valgono per tutto il pool in game, non solo per la selezione del libro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Analisi dei bias documentata con numeri prima/dopo in book/catalog/bias-analysis.md
- [x] #2 Ordine delle risposte bilanciato: l'opzione socialmente desiderabile e' prima in circa meta' dei dilemmi (e in 5 su 10 per capitolo del libro)
- [x] #3 Dilemmi-tentazione: le dimensioni non coinvolte sono neutre (0.5) su entrambe le risposte; dilemmi di conflitto: nessuna opzione ha un totale globalmente piu' alto
- [x] #4 Etichette di risposta con formulazione non caricata sulle opzioni indicate nell'analisi
- [x] #5 JSON valido, 115 dilemmi, stessi _id, schema a 18 chiavi, pesi in [0,1], formattazione originale preservata (indent 4, CRLF)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cambiato in dilemmas_en.json: 100 dilemmi con punteggi modificati (40 riequilibrati, 33 riscritti a mano, 27 tentazioni con dimensioni non coinvolte a 0.5), 22 etichette, 35 coppie di risposte scambiate. Non in produzione: il rollout e' TASK-371 (dipende da TASK-323 e TASK-372). Metriche prima/dopo in book/catalog/bias-analysis.md; riproducibili con node book/catalog/pool-metrics.mjs.
<!-- SECTION:NOTES:END -->
