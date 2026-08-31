---
id: TASK-205
title: 'Studio UX e Design: Spotify Wrapped finale Party'
status: Open Points
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 09:53'
labels:
  - party-room
  - ux
  - game-design
  - ai
dependencies:
  - TASK-123
priority: high
type: spike
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Studio approfondito di Game Design e UX per ripensare la schermata finale di Party Room in stile Spotify Wrapped, a partire dalla baseline gia' consegnata da TASK-123 (Done, 2026-08-02): flow sequenziato a stadi (archetipi -> verdetto AI di gruppo -> premi uno alla volta -> azioni), 5 award gia' calcolati in party_awards.py (closestPair/'la coppia affine', moralMinority/'la minoranza morale', mostAlignedWithGroup/'il preferito della macchina', contrarian/'il contrarian', dilemma piu' controverso), lista finale colorata per archetipo, bottone Rigioca e recap card condivisibile via shareCard.js (no AI, canvas client-side).

Lo studio si concentra solo su cio' che non esiste ancora: 1) un flow piu' cinematografico in stile 'stories' animate (slide con transizioni) al posto dell'attuale sequenza statica a stadi; 2) personalizzazione individuale con radar chart a 6 dimensioni + un verdetto AI caustico per il singolo partecipante (oggi il verdetto AI via Groq e' generato solo a livello di gruppo, mai per singolo); 3) un archetipo collettivo di gruppo calcolato come dato esplicito (oggi esiste solo il verdetto testuale, nessun 'archetipo di gruppo' come valore). A valle dell'accettazione della proposta da parte dell'utente verranno generate le relative card di implementazione modulari.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Studio di game design e UX completato e presentato, esplicito su cosa e' gia' esistente (baseline TASK-123) e cosa e' nuovo
- [x] #2 Definizione dell'architettura dati per i tre punti nuovi: flow stories animato, radar + verdetto AI individuale (con fallback se Groq non disponibile), archetipo collettivo di gruppo
- [ ] #3 Validazione e accettazione dell'utente della proposta prima della scomposizione in card operative
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Studio completato e presentato come artifact: https://claude.ai/code/artifact/855d6980-e2fe-4119-8f8b-2934669ac6da (Party Finale Spike). Copre esplicitamente la baseline gia' shippata da TASK-123 (AC1) e definisce l'architettura dati per le 3 proposte genuinamente nuove (AC2): 1) pass cinematografico sul sequencing (solo frontend, nessun dato nuovo, vincolo esplicito ereditato da TASK-123 - nessun timer/auto-advance, solo tap); 2) archetipo collettivo di gruppo (backend quasi gratis: media dei participant_averages_by_index gia' calcolati + riuso diretto di assign_archetype(), nessuna nuova logica AI); 3) radar individuale + verdetto AI personale per partecipante (nuove chiamate Groq per-partecipante con lo stesso pattern cache/conditional-write di _generate_party_group_verdict e del pairInsight Duel, fallback deterministico se Groq non disponibile; nuova esposizione dati - le medie dimensionali del chiamante vengono aggiunte a _party_room_participant_summary() solo quando isCaller e' true, stessa regola gia' in uso per non esporre mai i dati altrui). Le 3 proposte sono ordinate per costo di implementazione crescente e pensate per essere approvate indipendentemente, non in blocco. AC3 resta aperta: in attesa della validazione/accettazione esplicita dell'utente (anche parziale, proposta per proposta) prima di scomporre in card operative.
<!-- SECTION:NOTES:END -->
