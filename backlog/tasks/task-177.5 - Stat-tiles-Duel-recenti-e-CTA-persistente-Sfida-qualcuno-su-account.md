---
id: TASK-177.5
title: 'Stat tiles, Duel recenti e CTA persistente ''Sfida qualcuno'' su /account'
status: To Do
assignee: []
created_date: '2026-08-10 09:34'
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
- [ ] #1 Le 3 stat tile e la lista Duel recenti sono visibili e corrette per un utente con almeno un Duel completato
- [ ] #2 'Vedi' porta al confronto esistente del Duel selezionato; 'Rematch' avvia il flusso di rematch gia' esistente
- [ ] #3 Il CTA 'Sfida qualcuno di nuovo' e' raggiungibile da /account senza dover rifare il test, ed e' tracciato lato analytics
- [ ] #4 Stato vuoto chiaro (non un errore) per un utente senza Duel completati
<!-- AC:END -->
