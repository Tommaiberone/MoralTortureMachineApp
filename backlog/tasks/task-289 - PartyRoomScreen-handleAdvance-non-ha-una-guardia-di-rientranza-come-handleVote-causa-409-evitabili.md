---
id: TASK-289
title: >-
  PartyRoomScreen: handleAdvance non ha una guardia di rientranza come
  handleVote, causa 409 evitabili
status: Done
assignee: []
created_date: '2026-09-09 13:42'
updated_date: '2026-09-18 09:12'
labels:
  - bug
  - frontend
  - party-room
dependencies: []
priority: low
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante ops-alerts-sweep (2026-09-09): 11 righe (409, /party-rooms/{room_code}/advance) in prod-moral-torture-machine-ops-error-alerts, quasi tutte in cluster ravvicinati (1-3s tra loro, es. 2026-09-09T04:49:15/18/19, 04:30:29/31, 05:12:34/35), tutte host-only (l'endpoint restituisce 403 a un non-host, quindi il conflitto e' sempre lo stesso host contro se stesso). L'unico race documentato nel codice (backend_fastapi.py advance_party_room, la ConditionExpression su status='reveal') e' con il safety-net timeout in _advance_party_room_if_due, ma quel percorso non richiama una seconda POST /advance dallo stesso client e scatta solo dopo PARTY_ROOM_SAFETY_TIMEOUT_MS (molto piu' di 1-3s) - non spiega bene il pattern osservato. PartyRoomScreen.jsx: handleAdvance (righe ~277-289) fa solo 'setAdvancing(true)' senza controllare 'if (advancing) return' prima, a differenza del suo sibling handleVote (riga ~250) che ha 'if (!room?.currentDilemma || voting) return' come guardia esplicita oltre al prop disabled sul bottone - stessa classe di azione (submit host-gated), stessa schermata, pattern divergente (CLAUDE.md 'reuse and unify', TASK-214/ADR-095). Ipotesi piu' probabile: doppio tap impaziente prima che il re-render disabiliti visivamente il bottone, o due tab/dispositivi con lo stesso anonymous_user_id da host. Nessun impatto utente visibile (il fallimento e' silenzioso, handleAdvance ignora una risposta non-ok), ma genera rumore evitabile nell'alert pipeline.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aggiungere a handleAdvance la stessa guardia di rientranza esplicita gia' usata da handleVote (es. 'if (advancing) return' in testa alla funzione)
- [x] #2 Verificare che il pattern non sia altrove nello stesso file (es. altri handler host-only) con la stessa mancanza
- [x] #3 Confermare con pnpm lint/build:prod che la modifica non introduce regressioni
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Aggiunta la guardia 'if (advancing) return;' in testa a handleAdvance (PartyRoomScreen.jsx), stesso pattern gia' usato da handleVote. AC#2: trovato lo stesso gap anche in handleStart e handleRematch (entrambi host/creator-gated, entrambi facevano affidamento solo sul prop 'disabled' del bottone) - aggiunta la stessa guardia a entrambi per coerenza (CLAUDE.md 'reuse and unify', TASK-214/ADR-095). Nessun cambio di comportamento visibile: il fallimento del secondo tentativo era gia' silenzioso lato UI, questo elimina solo la seconda richiesta di rete e il conseguente 409 in tabella. Verificato: pnpm lint pulito, pnpm build:prod pulito. Risolto durante ops-alerts-sweep del 2026-09-18, su richiesta esplicita dell'utente di risolvere i task collegati alla sweep.
<!-- SECTION:NOTES:END -->
