---
id: TASK-110
title: >-
  Le persone che vengono invitate a rispondere agli stessi dilemmi, devono
  vedere anche le percentuali di persone che hanno risposto nei vari modi,
  quindi il flusso deve essere uguale a quello di chi lo fa per la prima volta
status: In Progress
assignee: []
created_date: '2026-07-31 15:04'
updated_date: '2026-08-05 08:44'
labels: []
dependencies: []
ordinal: 24000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 L'invitato che risponde ai dilemmi di una Challenge/Duel vede, dopo ogni risposta, la stessa schermata di reveal con percentuali (pie chart yes/no) che vede chi fa il test la prima volta in EvaluationDilemmasScreen
- [ ] #2 La risposta dell'invitato viene registrata anche come voto aggregato (POST /vote) esattamente come nel flusso di prima volta, cosi' contribuisce alle percentuali mostrate a tutti
- [ ] #3 Dopo il reveal, un pulsante esplicito avanza al dilemma successivo o, sull'ultimo, invia le risposte e naviga al confronto - nessun avanzamento automatico, stesso pattern del flusso di prima volta
- [ ] #4 Comportamento identico su web e Android (nessuna nuova dipendenza nativa)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: file rinominato da un nome derivato dal titolo (234 caratteri, superava il limite di path di Windows e faceva fallire backlog task edit con ENAMETOOLONG) a task-110.md - id/titolo in frontmatter invariati, backlog CLI risolve per id quindi nessun impatto funzionale. Investigazione: ChallengeLandingScreen.jsx (flusso invitato) non mostra il reveal a percentuali che invece EvaluationDilemmasScreen.jsx mostra dopo ogni risposta nel flusso di prima volta, e non chiama mai POST /vote - le risposte dell'invitato non contribuiscono nemmeno alle percentuali aggregate viste da tutti. I dati necessari (teaseOption1/2, yesCount, noCount, _id nel formato baseId-language) sono gia' presenti nella risposta di GET /dilemmas/by-ids (item raw via decimal_to_native, nessun filtro campi) - nessun cambio backend necessario, fix solo frontend in ChallengeLandingScreen.jsx replicando il pattern voting/reveal/pulsante-esplicito di EvaluationDilemmasScreen.jsx.
<!-- SECTION:NOTES:END -->
