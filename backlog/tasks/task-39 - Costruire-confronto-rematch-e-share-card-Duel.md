---
id: TASK-39
title: 'Costruire confronto, rematch e share card Duel'
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-07-31 14:17'
labels:
  - m4-duel
  - frontend
  - sharing
  - growth
dependencies:
  - TASK-37
  - TASK-38
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mostrare compatibilità, accordi, disaccordo maggiore, archetipi e azioni rematch/share.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Entrambi vedono lo stesso confronto
- [x] #2 Rematch crea una nuova challenge attribuita
- [x] #3 Card confronto non espone risposte private
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ChallengeCompareScreen.jsx su /challenge/:token/compare: entrambi i partecipanti vedono lo stesso GET /challenges/{token}/compare (nessuna differenza per ruolo). Rematch (POST /challenges/{token}/rematch) crea un nuovo challengeToken con rematchOfToken salvato per attribution, chi clicca diventa il nuovo creator. Card di confronto mostra solo archetipi (nome/emoji/colore) e percentuali di accordo aggregate per dimensione (perDimension agreementPct, mostAligned/mostDivergentDimension) - MAI risposte grezze ai singoli dilemmi ne' testo delle scelte. Anche la 'Sfida un amico' su ResultsScreen.jsx (nuova sezione dedicata) crea profilo+sfida e mostra il link condivisibile con WhatsApp/copia link.
<!-- SECTION:NOTES:END -->
