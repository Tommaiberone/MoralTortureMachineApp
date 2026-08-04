---
id: TASK-130
title: Skill di sweep per gli alert operativi in DynamoDB
status: Done
assignee: []
created_date: '2026-08-04 07:28'
updated_date: '2026-08-04 07:35'
labels: []
dependencies:
  - TASK-129
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creare una skill di progetto (.claude/commands/, sul modello di routine-serale.md) che fa una sweep periodica della tabella ops_error_alerts (TASK-129): raggruppa gli alert per (statusCode, pathSignature), studia la causa nel codice per ogni gruppo, ed elimina dalla tabella solo i gruppi la cui causa e' chiara, non azionabile o gia' risolta (es. rumore di bot su path statici, 4xx di business logic attesi). Per tutto cio' che non e' chiaramente innocuo, la skill NON modifica codice/infra da sola: segue il routing di CLAUDE.md (crea task Backlog/To Do/regression a seconda del caso) e lascia la riga in tabella, poi notifica l'utente con un riepilogo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nuovo file .claude/commands/*.md con frontmatter description, invocabile come skill/slash command
- [ ] #2 La skill usa aws dynamodb scan/delete-item (profilo personal, coerente con routine-serale.md) per leggere e ripulire la tabella ops_error_alerts
- [ ] #3 Raggruppa gli alert per (statusCode, pathSignature) prima di analizzarli, non riga per riga
- [ ] #4 Elimina dalla tabella solo i gruppi per cui la causa e' chiara e non richiede un intervento (rumore innocuo, 4xx di business logic gia' noti); tutto il resto resta in tabella
- [ ] #5 Per ogni causa che invece richiede un fix, la skill crea il task Backlog.md appropriato secondo le regole di routing di CLAUDE.md invece di modificare codice/infra da sola
- [ ] #6 Al termine produce un riepilogo leggibile (gruppi trovati, righe eliminate col motivo, righe lasciate con eventuale task collegato)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Creata .claude/commands/ops-alerts-sweep.md sul modello di routine-serale.md: scansiona ops_error_alerts via aws dynamodb scan (profilo personal), raggruppa per (statusCode, pathSignature) gia' normalizzato da TASK-129, studia la causa nel codice, elimina solo i gruppi con causa chiara e non azionabile (business logic attesa, rumore esterno, causa gia' risolta), e per tutto il resto crea/riusa un task Backlog.md secondo il routing di CLAUDE.md invece di modificare codice/infra. Non ancora eseguita una sweep reale in produzione (nessun alert accumulato finora oltre ai due che hanno originato questo lavoro).
<!-- SECTION:FINAL_SUMMARY:END -->
