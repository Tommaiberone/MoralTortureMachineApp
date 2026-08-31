---
id: TASK-203
title: Fissare a 5 dilemmi Party Mode e Solo Evaluation
status: To Do
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 08:05'
labels:
  - frontend
  - backend
  - game-design
dependencies: []
priority: medium
type: enhancement
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Standardizzare la durata dell'esperienza di gioco a esattamente 5 dilemmi sia per Party Mode che per Solo Evaluation (Test Your Morality). Rimuovere la varianza 3/5/7 dall'esperimento TASK-23 in EvaluationDilemmasScreen.jsx (getTestLengthVariant/TEST_LENGTH_VARIANTS/maxDilemmasRef) e fissare maxDilemmas = 5. Aggiornare PARTY_ROOM_DEFAULT_DILEMMAS = 5 in backend_fastapi.py (oggi 6), CreatePartyRoomRequest e test backend. Allineare contatori di progresso (1/5 ... 5/5) e testi correlati.

TASK-23 (In Progress, esperimento M2-activation) e' stato archiviato per decisione esplicita dell'utente (2026-08-31): la sua AC#3 (report di confronto completion/result-to-share tra varianti) resta volutamente non completata, la scelta di fissare a 5 e' presa direttamente senza attendere quel confronto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Solo Evaluation propone sempre esattamente 5 dilemmi a tutti gli utenti
- [ ] #2 Party Room crea stanze con esattamente 5 round di default
- [ ] #3 Tutti i test backend e frontend aggiornati e verdi col nuovo conteggio a 5
- [ ] #4 I contatori di avanzamento mostrano 1/5 ... 5/5
- [ ] #5 La SEO description di EvaluationDilemmasScreen torna a menzionare il numero fisso di dilemmi (5) invece del testo generico introdotto da TASK-180 per l'esperimento ora rimosso
<!-- AC:END -->
