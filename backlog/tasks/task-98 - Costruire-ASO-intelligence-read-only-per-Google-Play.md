---
id: TASK-98
title: Costruire ASO intelligence read-only per Google Play
status: Blocked
assignee: []
created_date: '2026-07-29 13:59'
updated_date: '2026-07-29 14:23'
labels:
  - growth
  - aso
  - android
  - analytics
  - automation
dependencies:
  - TASK-6
references:
  - >-
    backlog/tasks/task-79 -
    Ripositionare-Play-Store-sulla-comparazione-sociale.md
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Importare periodicamente i report di acquisizione Google Play (keyword di ricerca organica, store listing visitors, installer e visitor-to-installer conversion rate), più Android Vitals e la listing localizzata attuale. Calcolare opportunità ASO revisionabili senza modificare, caricare o pubblicare automaticamente la listing o gli asset Play.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 #1 Importa report Play per keyword, canale, Paese e conversione visitor-to-installer quando il report è disponibile.
- [x] #2 #2 Evidenzia keyword con volume/crescita e conversione bassa, Paesi con opportunità e regressioni di crash/ANR o slow rendering.
- [x] #3 #3 Confronta le proposte con il contenuto reale dell'app e con i limiti Play: nome 30, descrizione breve 80 e descrizione completa 4000 caratteri.
- [x] #4 #4 Produce una proposta localizzata IT/EN con evidenza, rischio policy e link ai file/asset interessati; nessuna chiamata di scrittura a Play è consentita.
- [ ] #5 #5 L'identità Play usa GitHub OIDC e un service account senza chiavi statiche, con soli permessi Play read-only e nessuna autorizzazione di pubblicazione.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Avvio 2026-07-29: implementazione report ASO read-only e workflow schedulato; nessuna modifica automatica della scheda Play.

Implementato 2026-07-29: il collector legge soltanto una URI gs:// esplicitamente configurata del report Play Acquisition e Android Vitals; non include endpoint Publishing/Edits. Bloccato soltanto dall'assegnazione del service account read-only, dalla URI del report disponibile e dallo snapshot IT/EN della listing.

Ripreso 2026-07-29: migrazione a GitHub OIDC e service account senza chiave in corso.

OIDC verificato 2026-07-29: service account keyless growth-intelligence creato e vincolato al solo repository. Restano l'invito read-only in Play Console, URI del report e snapshot listing.

Correzione stato: il meccanismo OIDC è pronto, ma il permesso Play Console read-only deve ancora essere assegnato dall'owner; il criterio resta aperto fino a quella concessione.
<!-- SECTION:NOTES:END -->
