---
id: TASK-210
title: 'Party Room finale: archetipo collettivo di gruppo'
status: Done
assignee: []
created_date: '2026-08-31 10:04'
updated_date: '2026-09-04 08:27'
labels:
  - backend
  - frontend
  - party-room
dependencies:
  - TASK-123
  - TASK-205
priority: medium
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dalla proposta 2 dello spike TASK-205: calcolare un archetipo esplicito per l'intera stanza, non solo il verdetto testuale AI gia' esistente. Media dei sei valori dimensionali su tutti i partecipanti a partire da participant_averages_by_index (gia' calcolato in get_party_room, backend_fastapi.py), poi un'unica chiamata a assign_archetype() - la stessa funzione deterministica e versionata gia' usata per ogni archetipo individuale in backend/src/archetype_engine.py. Nessuna nuova logica AI: l'AI non decide mai i punteggi, questo riusa solo il motore esistente su un vettore aggregato. Aggiungere response['groupArchetype'] accanto al gia' esistente groupVerdict nella risposta GET /party-rooms/{code} quando lo status e' 'completed', nessun caching necessario (e' aritmetica, non una chiamata Groq). Frontend: un nuovo stadio nella sequenza finale con lo stesso stile dello stadio archetipo individuale, piu' l'identita' visiva dell'archetipo di gruppo aggiunta alla recap card di shareCard.js.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GET /party-rooms/{code} per una stanza completed include groupArchetype (stesso shape di archetype: archetypeId, archetypesVersion, name, description, strength, blindSpot, visual)
- [x] #2 groupArchetype e' calcolato dalla media delle sei dimensioni di tutti i partecipanti tramite assign_archetype(), nessuna nuova chiamata Groq
- [x] #3 La schermata finale mostra un nuovo stadio con l'archetipo di gruppo
- [x] #4 La recap card condivisibile (shareCard.js) include l'identita' visiva dell'archetipo di gruppo
- [x] #5 Test backend aggiunti/aggiornati e verdi, pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Backend: GET /party-rooms/{code} now returns groupArchetype for a completed room (mean of participant_averages_by_index via compute_dimension_averages, fed through the existing assign_archetype() - no new Groq call, no caching needed since it's pure arithmetic). Frontend: new 'groupArchetype' stage in the final stories-style sequence (card-default styled, tinted with the archetype's own color, reusing results.archetype_strength/archetype_blind_spot i18n keys), and shareCard.js's generatePartyRecapCardDataUrl/sharePartyRecapCard now lead with the group archetype's emoji+name and use its color as the card accent. Backend test added (test_completed_room_includes_group_archetype); pnpm lint and pnpm build:prod both pass.
<!-- SECTION:NOTES:END -->
