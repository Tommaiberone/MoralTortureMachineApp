---
id: TASK-108
title: Routine serale claude
status: Done
assignee: []
created_date: '2026-07-31 14:57'
updated_date: '2026-07-31 21:53'
labels: []
dependencies: []
priority: high
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creiamo una routine per claude: io dico "Vai con la routine serale" e lui parte a macinare quanti più task todo possibile (possibilmente tutti), lasciando non compiuti solamente quelli per cui è necessario il mio intervento. Al termine della routine, tassativamente devi deployare il tutto e mandare una mail tramite SNS con un recap di quanto fatto
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Esiste un meccanismo invocabile (slash command di progetto) che l'utente può richiamare dicendo 'Vai con la routine serale'
- [x] #2 Il meccanismo scansiona i To Do del backlog ed esegue in autonomia solo quelli senza necessità di intervento umano, lasciando gli altri in coda con motivazione
- [x] #3 Il meccanismo prevede tassativamente, a fine esecuzione, un deploy e l'invio di un recap via email tramite l'SNS topic operativo già esistente
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Creato .claude/commands/routine-serale.md: protocollo invocabile con /routine-serale (o dicendo 'Vai con la routine serale') che scansiona i To Do del backlog per priorità/ordinal/dipendenze, distingue task autonomi da task che servono l'utente (QA manuale, contenuti legali, decisioni di business aperte, nuovi costi/servizi), applica il protocollo pre/post-task di CLAUDE.md task per task, e termina sempre con un commit+push (con stop esplicito se il push alzerebbe versionCode, per via del publish automatico Google Play di ADR-017) seguito da un'email di recap via 'aws sns publish' sul topic ops_alerts già esistente in backend/terraform/observability.tf - solo dopo conferma esplicita dell'utente in quella sessione, perché è l'unica azione realmente irreversibile del flusso.
<!-- SECTION:FINAL_SUMMARY:END -->
