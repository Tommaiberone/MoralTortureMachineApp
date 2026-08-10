---
id: TASK-177.5
title: 'Stat tiles, Duel recenti e CTA persistente ''Sfida qualcuno'' su /account'
status: In Progress
assignee: []
created_date: '2026-08-10 09:34'
updated_date: '2026-08-10 09:54'
labels:
  - frontend
  - growth
dependencies:
  - TASK-177.4
parent_task_id: TASK-177
priority: medium
type: enhancement
ordinal: 73000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dipende da TASK-177.4 (endpoint backend). Renderizzare su /account: riga di 3 stat tile (Duel completati / compatibilita' media / archetipi incontrati), lista dei Duel recenti con azioni 'Vedi' (-> ChallengeCompareScreen) e 'Rematch' (stesso flusso gia' esistente in ChallengeCompareScreen.jsx), e un CTA primario persistente 'Challenge someone new' che avvia lo stesso flusso oggi disponibile solo su ResultsScreen subito dopo un test - oggi, una volta lasciata quella schermata, non c'e' alcun modo di iniziare una nuova sfida senza rifare l'intero test: e' un buco reale nel loop di crescita (doc-2, North Star metric). Stato vuoto esplicito se l'utente non ha ancora completato Duel. Vedi mockup: https://claude.ai/code/artifact/32590b56-c0ab-482e-9632-7b4afd21ea82
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le 3 stat tile e la lista Duel recenti sono visibili e corrette per un utente con almeno un Duel completato
- [x] #2 'Vedi' porta al confronto esistente del Duel selezionato; 'Rematch' avvia il flusso di rematch gia' esistente
- [x] #3 Il CTA 'Sfida qualcuno di nuovo' e' raggiungibile da /account senza dover rifare il test, ed e' tracciato lato analytics
- [x] #4 Stato vuoto chiaro (non un errore) per un utente senza Duel completati
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Stat tiles (Duels completed / avg. compatibility / archetypes met), recent-Duels list with View (-> /challenge/:token/compare) and Rematch (POST .../rematch then navigate to the new challenge's existing share-link screen, reusing ChallengeLandingScreen's isOwnChallenge UI rather than duplicating it) actions, and a persistent 'Challenge someone new' CTA (POST /challenges with no profilePublicId, backend already defaults to the caller's latest profile) added to AccountDeleteScreen.jsx. challenge_share_ready/challenge_rematch_created tracked with surface:'account'. Explicit empty state (section simply omitted, no error) when duelStats.completedDuelsCount is 0. pnpm lint + build:prod clean. NOT YET PUSHED - depends on TASK-177.4's endpoint, which depends on the not-yet-applied GSI.
<!-- SECTION:NOTES:END -->
