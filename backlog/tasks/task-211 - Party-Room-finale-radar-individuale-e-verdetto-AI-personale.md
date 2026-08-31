---
id: TASK-211
title: 'Party Room finale: radar individuale e verdetto AI personale'
status: To Do
assignee: []
created_date: '2026-08-31 10:04'
labels:
  - backend
  - frontend
  - party-room
  - ai
dependencies:
  - TASK-123
  - TASK-205
priority: medium
type: feature
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dalla proposta 3 (la piu' corposa) dello spike TASK-205: dare a ciascun partecipante un momento personale nella schermata finale, non solo il verdetto di gruppo gia' esistente. Backend: _party_room_participant_summary() (backend_fastapi.py) espone oggi solo isCaller/displayName/isHost/archetype - aggiungere le sei medie dimensionali (participant_averages_by_index, gia' calcolate) SOLO quando isCaller e' true, stessa regola gia' in uso altrove per non esporre mai i dati di un altro partecipante. Una nuova funzione Groq per-partecipante (stesso pattern cache/conditional-write di _generate_party_group_verdict e del pairInsight Duel: generata una sola volta, salvata sulla riga del partecipante con ConditionExpression attribute_not_exists, fallback deterministico se Groq non e' disponibile) genera un verdetto caustico personale a partire da archetipo+medie del singolo, stesso prompt shape del verdetto Solo Evaluation di TASK-121 - mai risposte grezze per-dilemma (vincolo TASK-39). Frontend: un nuovo stadio 'tuo' nella sequenza finale, visibile solo al partecipante a cui appartiene, con un RadarChart Recharts a 6 assi - stesso componente/pattern gia' usato in ResultsScreen.jsx, solo alimentato dalle medie della sessione party invece che del test solista.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET /party-rooms/{code} per una stanza completed include le medie dimensionali SOLO nella entry del chiamante (isCaller true), mai in quelle degli altri partecipanti
- [ ] #2 Un verdetto AI personale per partecipante viene generato una sola volta (conditional write, mai rigenerato) con fallback deterministico se Groq non e' disponibile
- [ ] #3 Il prompt Groq riceve solo archetipo e medie dimensionali del singolo partecipante, mai risposte grezze per-dilemma
- [ ] #4 La schermata finale mostra un radar a 6 dimensioni + il verdetto personale, visibile solo al partecipante proprietario
- [ ] #5 Test backend aggiunti/aggiornati (incluso un test che verifica che le medie di un partecipante non compaiano mai nella entry di un altro), pnpm lint e pnpm build:prod passano
<!-- AC:END -->
