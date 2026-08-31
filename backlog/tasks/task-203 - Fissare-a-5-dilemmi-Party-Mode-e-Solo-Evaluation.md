---
id: TASK-203
title: Fissare a 5 dilemmi Party Mode e Solo Evaluation
status: Done
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 09:43'
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
- [x] #1 Solo Evaluation propone sempre esattamente 5 dilemmi a tutti gli utenti
- [x] #2 Party Room crea stanze con esattamente 5 round di default
- [x] #3 Tutti i test backend e frontend aggiornati e verdi col nuovo conteggio a 5
- [x] #4 I contatori di avanzamento mostrano 1/5 ... 5/5
- [x] #5 La SEO description di EvaluationDilemmasScreen torna a menzionare il numero fisso di dilemmi (5) invece del testo generico introdotto da TASK-180 per l'esperimento ora rimosso
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rimosso l'esperimento 3/5/7 di TASK-23 da EvaluationDilemmasScreen.jsx (TEST_LENGTH_VARIANTS/getTestLengthVariant/maxDilemmasRef eliminati, sostituiti da una costante fissa MAX_DILEMMAS = 5; rimosso anche l'import ora inutilizzato di getAnonymousUserId). PARTY_ROOM_DEFAULT_DILEMMAS portato da 6 a 5 in backend_fastapi.py (PARTY_ROOM_MIN/MAX_DILEMMAS invariati a 3/12: restano solo i limiti di validazione dell'API, il frontend non ha mai inviato un dilemmaCount custom in fase di creazione stanza, quindi il default e' l'unica cosa che conta). I contatori di progresso (1/5...5/5) sono gia' derivati dinamicamente da MAX_DILEMMAS (Solo Evaluation) e da room.dilemmaCount letto dalla risposta API (Party Room), quindi si sono aggiornati automaticamente senza altre modifiche. SEO description di EvaluationDilemmasScreen tornata a menzionare '5' invece del testo generico introdotto da TASK-180 per l'esperimento ora rimosso. Le landing SEO bilingui (seoLandings.js, ADR-020) menzionavano gia' 'five/cinque dilemmi' in entrambe le lingue - nessuna modifica necessaria li', gia' allineate. Nessun test backend o frontend hardcodava il vecchio default (6) o l'esperimento 3/5/7 (verificato via grep). Test eseguiti: 184 test backend verdi (unittest discover), py_compile pulito, pnpm lint pulito, pnpm build:prod pulito.

Version bump: 1.7.1 -> 1.7.2, versionCode 21 -> 22 (packaged web code changed - EvaluationDilemmasScreen.jsx logic and SEO copy).
<!-- SECTION:FINAL_SUMMARY:END -->
