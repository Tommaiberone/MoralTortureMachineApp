---
id: TASK-47
title: 'Implementare host, lobby e reconnect Party Room'
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-08-02 09:07'
labels:
  - m6-party
  - frontend
  - ux
  - polling
dependencies:
  - TASK-46
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Esperienza host/partecipante con lobby, presenza, domanda, timer, vote e recupero connessione, tutto via polling HTTP invece di WebSocket (vedi ADR): reconnect e' semplicemente una nuova GET dello stato corrente, senza gestione di sessione di connessione persistente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reconnect recupera lo stato corrente
- [x] #2 Host e partecipanti vedono stato coerente
- [x] #3 Timer e reveal gestiscono client in ritardo
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PartyRoomHomeScreen.jsx (/party: crea con nome+numero dilemmi, o entra con un codice) e PartyRoomScreen.jsx (/party/:roomCode) coprono lobby, domanda con timer, reveal e risultato finale in un solo componente pilotato dallo status della room via polling ogni 1.5s. Lobby: QR (libreria 'qrcode', nessun plugin nativo Capacitor quindi nessun rebuild Android richiesto) + lista partecipanti + bottone Start riservato all'host (min 2 persone). Reconnect (AC1): non serve logica dedicata, e' una conseguenza naturale del design stateless - un refresh o un nuovo mount rifà semplicemente GET /party-rooms/{code} e riparte da qualunque fase la room si trovi, identificato dallo stesso anonymous_user_id di sempre. Stato coerente tra host e partecipanti (AC2): un solo endpoint GET restituisce tutto lo stato visibile, tutti i client leggono la stessa fonte di verita'. Timer e client in ritardo (AC3): il countdown mostrato e' calcolato lato client da un timestamp di scadenza fornito dal server (ADR-050) solo per l'estetica; chi arriva in ritardo o riapre la scheda vede comunque la fase reale determinata dal server, mai un countdown falso. Aggiunta dipendenza frontend 'qrcode'. Icona Party Room aggiunta in homepage. pnpm lint e build:prod puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
