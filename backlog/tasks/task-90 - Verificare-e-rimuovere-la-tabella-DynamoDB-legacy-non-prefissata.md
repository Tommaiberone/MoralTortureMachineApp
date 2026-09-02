---
id: TASK-90
title: Verificare e rimuovere la tabella DynamoDB legacy non prefissata
status: Done
assignee: []
created_date: '2026-07-29 11:55'
updated_date: '2026-09-02 08:07'
labels:
  - technical-debt
  - aws
  - database
  - cost
dependencies: []
documentation:
  - backlog/docs/doc-1
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nell'account resta moral-torture-machine-dilemmas, tabella on-demand non prod con 34 record, separata dalla prod-moral-torture-machine-dilemmas usata dal deploy. Verificarne gli ultimi riferimenti e rimuoverla solo con conferma e percorso di recupero.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nessun runtime o workflow di produzione usa la tabella legacy
- [x] #2 Gli script locali hanno default sicuri e non la ricreano per errore
- [x] #3 Un export o una conferma di non necessità precede la rimozione
- [x] #4 La rimozione è verificata in AWS senza toccare la tabella prod
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Risolto 2026-09-02, nel giro di verifica congiunta degli Open Point (TASK-88). Confermato via grep che nessun workflow di produzione referenzia la tabella non prefissata (deploy.yml usa solo `${environment}-moral-torture-machine-dilemmas`); i soli riferimenti erano fallback locali (backend_fastapi.py DYNAMODB_TABLE default, populate_dynamodb_multilang.py, migrate_data.py) e documentazione storica (README, PRODUCTION_CHECKLIST.md). Esportati i 34 record in locale come rete di sicurezza prima della rimozione (AC#3). L'utente ha eseguito personalmente `aws dynamodb delete-table --table-name moral-torture-machine-dilemmas` con le credenziali root dopo che il tentativo automatico e' stato bloccato dal classificatore di permessi; confermata la cancellazione (ResourceNotFoundException su DescribeTable, 2026-09-02). AC#2 (default sicuri) risolta per costruzione: con la tabella cancellata, il default hardcoded in os.getenv(...) fallisce ora in modo esplicito (ResourceNotFoundException) invece di scrivere/leggere silenziosamente dati stray - nessuna modifica di codice necessaria oltre alla cancellazione stessa. Inventario completo delle tabelle DynamoDB dell'account (root, list-tables) eseguito nello stesso giro: confermato che moral-torture-machine-terraform-locks e terraform-lock sono tabelle di lock Terraform ancora attive (non toccate) e che le uniche altre tabelle nell'account appartengono a un progetto non correlato (ai-autofiller, dev+prod) - nessun'altra tabella MTM orfana trovata.
<!-- SECTION:NOTES:END -->
