---
id: TASK-205
title: 'Studio UX e Design: Spotify Wrapped finale Party'
status: Open Points
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 08:06'
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
- [ ] #1 Studio di game design e UX completato e presentato, esplicito su cosa e' gia' esistente (baseline TASK-123) e cosa e' nuovo
- [ ] #2 Definizione dell'architettura dati per i tre punti nuovi: flow stories animato, radar + verdetto AI individuale (con fallback se Groq non disponibile), archetipo collettivo di gruppo
- [ ] #3 Validazione e accettazione dell'utente della proposta prima della scomposizione in card operative
<!-- AC:END -->
