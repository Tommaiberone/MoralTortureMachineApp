---
id: TASK-177.4
title: 'Endpoint: statistiche e Duel recenti dell''utente autenticato'
status: To Do
assignee: []
created_date: '2026-08-10 09:34'
labels:
  - backend
dependencies: []
parent_task_id: TASK-177
priority: medium
type: feature
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nessuna dipendenza dagli altri sotto-task (puo' procedere in parallelo a TASK-177.2). Oggi non esiste alcun modo di elencare 'le sfide Duel di un utente': challenges e challenge_participants (backend/terraform/main.tf) non hanno GSI su anonymousUserId, e il commento a backend_fastapi.py:1603-1607 ha gia' scartato l'aggiunta di un GSI ampio solo per l'export GDPR (caso raro), preferendo una Scan filtrata li'. Per questo endpoint (chiamato ad ogni visita a /account, quindi frequente, non raro) una Scan ripetuta sarebbe lenta/costosa: si raccomanda invece un contatore denormalizzato (es. nuovi attributi su users_table: completedDuelsCount, sumCompatibilityPct, distinctArchetypesMet, recentChallenges [lista limitata, es. ultimi 5 {challengeToken, opponentArchetypeId, compatibilityPct, completedAt}]), aggiornato incrementalmente in submit_challenge/compare quando un Duel raggiunge 'completed' per ciascun partecipante autenticato. Per uno storico Duel gia' esistente PRIMA che l'utente si autenticasse, fare un backfill una tantum dentro POST /users/claim-anonymous-data (evento raro, stesso ragionamento gia' accettato per la Scan dell'export) invece di mantenere un indice sempre attivo. Verificare la capacita' RCU/WCU della users_table (oggi 1/1 provisioned) prima di aumentare la frequenza di scrittura, per restare nel Free Tier condiviso (vincolo CLAUDE.md costi) - se il backfill via Scan risultasse comunque necessario a runtime (non solo al claim), fermarsi e valutare l'alternativa GSI con l'utente prima di procedere, come richiesto dal processo Free Tier del CLAUDE.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un endpoint autenticato restituisce: numero di Duel completati, compatibilita' media, numero di archetipi distinti incontrati, e gli ultimi N Duel completati (token/archetipo avversario/percentuale/data) per l'utente loggato
- [ ] #2 I contatori restano corretti sia per Duel completati dopo il login sia per quelli gia' completati anonimamente prima del claim (backfill verificato con un test)
- [ ] #3 Nessuna Scan a runtime su ogni richiesta; la capacita' aggiuntiva richiesta resta verificata contro il Free Tier condiviso
<!-- AC:END -->
