---
id: TASK-271
title: >-
  Party Room: eliminata la Query sui partecipanti dal path caldo del polling,
  contatori atomici sulla stanza, cache in-memory e poll adattivo
status: Done
assignee: []
created_date: '2026-09-05 19:41'
updated_date: '2026-09-05 19:53'
labels:
  - backend
  - frontend
  - party-room
  - performance
  - cost
dependencies: []
priority: high
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seguito diretto della discussione su TASK-49/TASK-191 (capacita' concorrente Party Room, gia' bruciata una volta in produzione a 1/1 RCU/WCU): l'utente ha chiesto un modo per ridurre le scritture/letture DynamoDB senza spendere, prima di eventualmente passare a on-demand billing (esplicitamente non attivato qui, richiede approvazione separata per costo). Implementate le tre leve gratuite discusse: (1) contatori atomici (participantCount, voteTallyByRound) mantenuti sull'item party_rooms via ADD, cosi' _advance_party_room_if_due (chiamata a OGNI poll/voto/advance durante 'question') non fa piu' nessuna Query sui partecipanti - solo aritmetica su campi gia' in memoria; (2) get_party_room salta del tutto la Query completa dei partecipanti durante la fase 'question' (l'unica fase ad alto volume dove il frontend non legge mai room.participants - verificato contro PartyRoomScreen.jsx), usando invece un GetItem mirato sulla sola riga del chiamante per isHost/hasVotedThisRound; roundResult ora legge voteTallyByRound invece di ricontare i partecipanti; (3) cache in-memory a TTL 0.6s (_get_room_cached) per il container Lambda caldo, stesso pattern gia' usato da enforce_zero_cost_burst_guard, usata solo dall'endpoint di polling (mai da join/start/advance/vote, dove una lettura stale costerebbe al piu' un 409 spurio, non un bug di correttezza) - viene ri-scritta subito dopo _advance_party_room_if_due cosi' la finestra di staleness resta minima. Frontend: poll adattivo, 1.5s durante 'question' (vera corsa a vedere chi ha finito), 3s durante lobby/reveal/errore (si aspetta un'azione umana, non un voto).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 party_rooms items hanno participantCount e voteTallyByRound, mantenuti via ADD in join_party_room e submit_party_vote
- [x] #2 _advance_party_room_if_due non fa piu' _list_party_participants durante 'question'
- [x] #3 get_party_room non fa la Query completa dei partecipanti durante 'question'; participants torna [] in quella fase, isHost/hasVotedThisRound restano corretti
- [x] #4 roundResult durante reveal e' sourced da voteTallyByRound
- [x] #5 Cache in-memory _get_room_cached usata solo dal GET di polling, mai dai path di scrittura
- [x] #6 Frontend: poll a 1.5s durante question, 3s altrove/su errore
- [x] #7 backend: tutti i 200 test passano (25 su test_party_room.py, inclusi 2 nuovi: omissione roster in question, riuso della cache); frontend: pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
REGRESSIONE CATTURATA E CORRETTA NELLA STESSA SESSIONE, prima che l'utente la incontrasse: uno smoke test manuale contro la produzione (creare stanza, join, vota) ha rivelato che POST /party-rooms/{code}/vote rispondeva 500 Internal Server Error dopo il deploy iniziale di questo task. Causa: ADD voteTallyByRound.#round.#choice :one usava un path annidato a 3 livelli - DynamoDB reale supporta ADD solo su attributi top-level, mai su un document path annidato (lo stesso pattern esistente altrove nel file, daily_moral_crime_votes, infatti usa gia' solo un #votes top-level, mai annidato - dettaglio che avrei dovuto notare prima). Il voto del partecipante veniva comunque salvato correttamente (la ConditionExpression su party_participants_table e' un'operazione separata, riuscita), ma il client riceveva un 500 invece della risposta di successo, e il tally non veniva mai incrementato. Il _FakeTable di test non l'ha intercettato perche' la sua implementazione di ADD era troppo permissiva (supportava path annidati che DynamoDB reale rifiuta). Fix: voteTallyByRound sostituito da attributi top-level dinamici (_party_room_vote_tally_attr: voteTally_{round}_{choice}), e il fake aggiornato per rifiutare esplicitamente un ADD non top-level (NotImplementedError), cosi' una futura regressione dello stesso tipo verrebbe presa dai test invece che da un utente reale. Verificato di nuovo con uno smoke test end-to-end contro la produzione dopo il fix. Vedi ADR-119.
<!-- SECTION:NOTES:END -->
