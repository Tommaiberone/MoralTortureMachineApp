---
id: TASK-290
title: >-
  Party Room: duel_write rate limit e' IP-only, stesso rischio falsi-positivi
  429 gia' risolto per party_room_poll (ADR-069)
status: Done
assignee: []
created_date: '2026-09-09 13:43'
updated_date: '2026-09-18 09:12'
labels:
  - bug
  - backend
  - party-room
  - rate-limit
dependencies: []
priority: low
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante ops-alerts-sweep (2026-09-09): 1 riga (429, rate_limit:duel_write, 2026-09-05T20:00:49) in prod-moral-torture-machine-ops-error-alerts. La regola 429 non porta il path letterale (scatta prima del routing), quindi non si puo' confermare con certezza che questa singola occorrenza venga da un endpoint Party Room piuttosto che da /profiles o /challenges/*. Pero' leggendo _rate_limit_rules_for_request e enforce_zero_cost_burst_guard (backend_fastapi.py) e' emerso un gap concreto: TASK-132/ADR-069 ha dato a GET /party-rooms/* (party_room_poll + global) una chiave rate-limit per-partecipante (IP + anonymous_user_id) proprio perche' piu' partecipanti Party Room sulla stessa rete/WiFi condividono un IP e si autolimitano a vicenda - ma tutte le POST di Party Room (join/vote/advance/start) ricadono nella regola 'duel_write', che resta sulla chiave IP-only (_rate_limit_source), la stessa condizione di falso-positivo che ADR-069 ha risolto solo lato lettura. ADR-069 lo scoping esplicito al solo GET era una scelta deliberata al momento ('ogni altro endpoint resta sulla chiave IP-only'), non una svista, ma il rischio e' identico in scrittura: piu' partecipanti nella stessa stanza/rete che votano/avanzano/joinano ravvicinati potrebbero condividere lo stesso bucket duel_write e ricevere 429 legittimi non dovuti ad abuso. Bassa priorita' perche' una sola occorrenza non confermata, non un pattern osservato.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Confermare o escludere, correlando un'occorrenza futura, se i 429 duel_write arrivano davvero da endpoint Party Room POST (join/vote/advance/start) sotto piu' partecipanti co-locati
- [x] #2 Se confermato, decidere se estendere _rate_limit_participant_source() alle regole duel_write quando il path e' /party-rooms/*, mantenendo la stessa logica additiva IP+anonymous_user_id di ADR-069
- [ ] #3 Se esclusa o giudicata troppo bassa-frequenza, chiudere con la motivazione registrata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Su richiesta esplicita dell'utente di risolvere subito i task collegati alla ops-alerts-sweep del 2026-09-18 (non c'e' stato modo di aspettare una correlazione futura come previsto da AC#1), ho valutato il rischio come sufficientemente chiaro dal codice per agire subito: la stessa identica classe di falso-positivo che ADR-069 ha gia' confermato e risolto per party_room_poll si applica meccanicamente a duel_write su Party Room (stesso fenomeno multi-partecipante-stesso-IP, stesso endpoint family). IMPLEMENTATO: enforce_zero_cost_burst_guard ora usa _rate_limit_participant_source() (IP + anonymous_user_id, additivo non sostitutivo) anche per la regola duel_write quando il path e' /party-rooms o /party-rooms/*, oltre a party_room_poll come gia' prima; ogni altro endpoint duel_write (/profiles, /challenges/*) resta sulla chiave IP-only invariata. AC#1 lasciato esplicitamente non spuntato: non e' stata fatta una correlazione con un'occorrenza futura, la decisione e' stata presa per analogia diretta con ADR-069 invece che per conferma diretta - se in futuro emergesse che la singola occorrenza storica non era affatto Party Room, il fix resta comunque corretto e a rischio zero (additivo). AC#3 non si applica (non e' stata esclusa/chiusa senza fix, e' stata implementata). Test aggiunti in test_analytics_models.py (PartyRoomPollRateLimitKeyTests): test_party_room_write_request_consumes_duel_write_with_the_participant_key, test_non_party_room_duel_write_request_stays_ip_only (controllo che /challenges resti IP-only). Suite completa: 268/268 passing.
<!-- SECTION:NOTES:END -->
