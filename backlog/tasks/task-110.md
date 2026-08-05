---
id: TASK-110
title: >-
  Le persone che vengono invitate a rispondere agli stessi dilemmi, devono
  vedere anche le percentuali di persone che hanno risposto nei vari modi,
  quindi il flusso deve essere uguale a quello di chi lo fa per la prima volta
status: Done
assignee: []
created_date: '2026-07-31 15:04'
updated_date: '2026-08-05 08:50'
labels: []
dependencies: []
ordinal: 24000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 L'invitato che risponde ai dilemmi di una Challenge/Duel vede, dopo ogni risposta, la stessa schermata di reveal con percentuali (pie chart yes/no) che vede chi fa il test la prima volta in EvaluationDilemmasScreen
- [x] #2 La risposta dell'invitato viene registrata anche come voto aggregato (POST /vote) esattamente come nel flusso di prima volta, cosi' contribuisce alle percentuali mostrate a tutti
- [x] #3 Dopo il reveal, un pulsante esplicito avanza al dilemma successivo o, sull'ultimo, invia le risposte e naviga al confronto - nessun avanzamento automatico, stesso pattern del flusso di prima volta
- [x] #4 Comportamento identico su web e Android (nessuna nuova dipendenza nativa)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: file rinominato da un nome derivato dal titolo (234 caratteri, superava il limite di path di Windows e faceva fallire backlog task edit con ENAMETOOLONG) a task-110.md - id/titolo in frontmatter invariati, backlog CLI risolve per id quindi nessun impatto funzionale. Investigazione: ChallengeLandingScreen.jsx (flusso invitato) non mostra il reveal a percentuali che invece EvaluationDilemmasScreen.jsx mostra dopo ogni risposta nel flusso di prima volta, e non chiama mai POST /vote - le risposte dell'invitato non contribuiscono nemmeno alle percentuali aggregate viste da tutti. I dati necessari (teaseOption1/2, yesCount, noCount, _id nel formato baseId-language) sono gia' presenti nella risposta di GET /dilemmas/by-ids (item raw via decimal_to_native, nessun filtro campi) - nessun cambio backend necessario, fix solo frontend in ChallengeLandingScreen.jsx replicando il pattern voting/reveal/pulsante-esplicito di EvaluationDilemmasScreen.jsx.

2026-08-05: implementato in ChallengeLandingScreen.jsx/.css + en.json (nessun cambio backend necessario, i dati yesCount/noCount/tease erano gia' nella risposta di GET /dilemmas/by-ids). handleChoice ora chiama POST /vote e mostra reveal (tease + pie chart percentuali, stessi componenti Recharts/renderPieLabel di EvaluationDilemmasScreen); handleNext (nuovo pulsante esplicito, nessun avanzamento automatico) avanza al dilemma successivo o sull'ultimo invia le risposte gia' raccolte in stato e naviga al confronto. Lint pulito, pnpm build:prod ok. Nessun controllo su browser/device reale eseguito in questa sessione (regola CLAUDE.md contro strumenti di browser automation) - verifica manuale del flusso da fare dall'utente prima di considerarlo definitivamente validato in produzione.
<!-- SECTION:NOTES:END -->
