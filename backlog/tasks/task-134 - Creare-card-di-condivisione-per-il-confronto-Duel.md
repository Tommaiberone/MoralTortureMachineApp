---
id: TASK-134
title: Creare card di condivisione per il confronto Duel
status: Done
assignee: []
created_date: '2026-08-04 09:39'
updated_date: '2026-08-04 10:56'
labels:
  - m4-duel
  - sharing
  - growth
  - frontend
dependencies:
  - TASK-39
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ChallengeCompareScreen.jsx condivide solo un link nudo su WhatsApp per il rematch: nessuna immagine condivisibile per il momento con piu' tensione narrativa del prodotto (due archetipi + percentuale di compatibilita' + dimensione piu' divergente). shareCard.js ha gia' un template piu' ricco riusabile (generatePartyRecapCardDataUrl per il Party Room): applicare lo stesso approccio al confronto 1:1, usando solo i dati aggregati gia' restituiti da GET /challenges/{token}/compare (creator.archetype, invitee.archetype, compatibility.overallAgreementPct, mostAlignedDimension, mostDivergentDimension) - MAI risposte grezze ai singoli dilemmi, che TASK-39 ha deliberatamente deciso di non esporre.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova funzione generateDuelCardDataUrl (o simile) in shareCard.js, canvas client-side, no AI/round-trip
- [x] #2 Card mostra entrambi gli archetipi, percentuale di compatibilita' e dimensione piu' allineata/divergente
- [x] #3 Card non espone risposte o testo delle scelte dei singoli dilemmi
- [x] #4 Bottone di condivisione/download della card e' visibile in ChallengeCompareScreen dopo il confronto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato: nuova generateDuelCardDataUrl/shareDuelCard in shareCard.js (formato Stories 1080x1920, stesso approccio canvas del Party Recap), mostra entrambi gli archetipi, overallAgreementPct, mostAligned/mostDivergentDimension - solo dati gia' restituiti da GET /challenges/{token}/compare, nessuna risposta ai singoli dilemmi. Bottone di download aggiunto in ChallengeCompareScreen.jsx dopo il blocco compare-dimensions. pnpm lint + build:prod puliti. Verifica visiva in browser reale NON eseguita.
<!-- SECTION:NOTES:END -->
