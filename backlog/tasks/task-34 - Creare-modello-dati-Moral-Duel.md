---
id: TASK-34
title: Creare modello dati Moral Duel
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:16'
labels:
  - m4-duel
  - backend
  - database
  - security
dependencies:
  - TASK-28
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creare Challenges e ChallengeParticipants con token sicuro, dilemma, stato, risposte, profilo, lingua e TTL.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Token non enumerabili, revocabili e mai loggati
- [x] #2 Challenge abbandonate scadono via TTL
- [x] #3 Risposte e dati privati non sono esposti prima dello sblocco
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tabelle challenges (PK challengeToken) e challenge_participants (PK challengeToken, SK role) in Terraform, provisioned 1/1. Token da secrets.token_urlsafe(16), mai loggati (solo passati come path param/response). TTL su expirationTime in entrambe le tabelle: challenge abbandonate (mai joinate/completate) scadono dopo 30 giorni (CHALLENGE_TTL_SECONDS). Nuovo POST /challenges/{token}/revoke: il creator puo' revocare una sfida non ancora completata (aggiunto dopo essermi accorto che l'AC 'revocabili' non era coperto - una sfida completata non e' revocabile per non nascondere retroattivamente un confronto gia' sbloccato all'invitato). Risposte/medie private mai esposte prima del completamento: open_challenge restituisce solo un teaser (nome/emoji/sharePhrase archetipo), mai le medie dimensionali.
<!-- SECTION:NOTES:END -->
