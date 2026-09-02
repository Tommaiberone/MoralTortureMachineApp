---
id: TASK-52
title: Riattivare Story Mode come contenuto premium episodico
status: Backlog
assignee: []
created_date: '2026-07-29 11:29'
updated_date: '2026-09-02 08:59'
labels:
  - m7-monetization
  - frontend
  - content
dependencies:
  - TASK-50
  - TASK-53
documentation:
  - backlog/docs/doc-2
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adattare Story Mode a episodi premium dopo la validazione dei pack una tantum.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Accesso dipende da entitlement server-side
- [ ] #2 Contenuto base non viene degradato
- [ ] #3 Analytics misura avvio e completamento episodi
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Chiuso 2026-09-02 come superato: TASK-185 (2026-08-10) aveva gia' deciso 'rimuovi tutto ora, non aspettare TASK-52' per lo Story Mode dormiente, lasciando pero' esplicitamente la tabella DynamoDB story_flows come decisione separata da prendere in futuro. Oggi (ADR-102, TASK-88) quella decisione e' stata presa: la tabella story_flows e' stata cancellata (2 item, esportati prima). Non resta piu' nessuno scaffolding dormiente da riattivare - codice, endpoint, route e dati sono tutti rimossi. Una futura Story Mode premium sarebbe una feature nuova da costruire da zero, non una 'riattivazione': questo task come scritto non ha piu' senso. Utente ha confermato la chiusura 2026-09-02.
<!-- SECTION:NOTES:END -->
