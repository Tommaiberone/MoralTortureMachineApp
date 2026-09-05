---
id: TASK-251
title: >-
  [regression] deploy.yml popola ancora la tabella DynamoDB story-flows,
  eliminata da TASK-185
status: Done
assignee: []
created_date: '2026-09-04 15:02'
updated_date: '2026-09-05 21:52'
labels:
  - regression
  - infra
  - ci
dependencies: []
priority: high
type: bug
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
App walkthrough TASK-190 (2026-09-04, agente infra): .github/workflows/deploy.yml righe 659-679,690-703, gli step 'Populate DynamoDB Story Flows' e 'Verify population' puntano a ${environment}-moral-torture-machine-story-flows (righe 663, 691). backlog/docs/doc-1 riga 746 conferma che questa tabella 'was deleted 2026-09-02 with the dormant Story Mode feature (TASK-185)'. Le note di TASK-185 dicono esplicitamente che la cancellazione della tabella/Terraform era una decisione SEPARATA dalla pulizia del codice app che quel task ha effettivamente fatto - e quella pulizia separata di deploy.yml non e' mai avvenuta. Lo step gira solo su workflow_dispatch (populate_dynamodb:true) o un marker [populate-db]/[populate-db-append] nel messaggio di commit, quindi non ha rotto i push ordinari finora, ma e' un percorso pipeline live, documentato e raggiungibile che fallira' (tabella non trovata) alla prima esecuzione - e siccome 'Verify population' vive nello stesso job dopo lo step story-flows, un suo fallimento puo' impedire la verifica del popolamento della tabella dilemmi, quella vera, che serve davvero.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rimossi gli step/riferimenti a story-flows da deploy.yml (o l'intero job ripulito se non serve piu' nulla di quella tabella)
- [x] #2 Verificato che il popolamento della tabella dilemmi (quella reale, ancora in uso) continui a funzionare da workflow_dispatch/marker di commit dopo la pulizia
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verifica di AC#2 fatta staticamente (lettura attenta dello YAML risultante: gli step Check dilemma files/Backup DynamoDB/Determine populate mode/Populate DynamoDB Dilemmas/Verify population restano intatti e usano solo variabili/percorsi relativi alla tabella dilemmi, mai a story-flows), non con un trigger live - questo percorso gira solo su workflow_dispatch o marker [populate-db]/[populate-db-append] nel commit, e avviarlo per davvero farebbe un backup+reload reale della tabella dilemmi in produzione solo per testare una pulizia, sproporzionato rispetto al rischio. Se vuoi una conferma end-to-end, va fatta con un push che usa deliberatamente il marker [populate-db].
<!-- SECTION:NOTES:END -->
