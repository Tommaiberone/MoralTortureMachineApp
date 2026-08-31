---
id: TASK-209
title: 'Party Room finale: pass cinematografico sul sequencing (stories-style)'
status: To Do
assignee: []
created_date: '2026-08-31 10:03'
labels:
  - frontend
  - party-room
  - ux
dependencies:
  - TASK-123
  - TASK-205
priority: medium
type: enhancement
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dalla proposta 1 dello spike TASK-205 (vedi artifact linkato nelle note di TASK-205): trasformare l'attuale sequenza a stadi statica della schermata finale di Party Room (archetipi -> verdetto AI -> premi uno alla volta -> azioni, gia' shippata da TASK-123) in un flow piu' cinematografico stile 'stories': slide full-bleed con transizione tra uno stadio e l'altro, barra di progresso segmentata in alto (uno spicchio per stadio, riempito fino allo stadio corrente). Nessun dato nuovo: si riordina/reskinna lo stesso array di stadi/awardCards gia' costruito in PartyRoomScreen.jsx per lo status 'completed'. Vincolo esplicito ereditato da TASK-123: SOLO avanzamento a tap (tap destro=avanti, tap sinistro=indietro), nessun timer/auto-advance - l'utente ha gia' rifiutato esplicitamente countdown/suspense in TASK-123.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 La schermata finale mostra transizioni tra stadi invece di uno swap istantaneo
- [ ] #2 Una barra di progresso segmentata in alto riflette lo stadio corrente
- [ ] #3 Avanzamento solo tramite tap/click esplicito, nessun timer o auto-advance
- [ ] #4 Nessuna modifica ai dati/awardCards esistenti, solo presentazione
- [ ] #5 pnpm lint e pnpm build:prod passano
<!-- AC:END -->
