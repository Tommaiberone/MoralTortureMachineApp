---
id: TASK-311
title: >-
  Nascondere il testo del dilemma nella modalita' libro cartaceo, mostrare solo
  le due opzioni
status: Done
assignee: []
created_date: '2026-09-23 09:51'
updated_date: '2026-09-23 09:52'
labels: []
dependencies: []
priority: medium
ordinal: 212000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente dopo TASK-291: quando una sessione (Solo Verdict o Convene Tribunal) e' aperta da un QR del gamebook fisico, il testo del dilemma e' gia' stampato sulla pagina - mostrarlo di nuovo nell'app e' ridondante. L'app deve mostrare solo le due opzioni di risposta (piu' progress/tease/grafico/esito, che non sono testo del dilemma). Non deve toccare le sessioni ordinarie (Solo Evaluation random, Duel, Party Room non da libro), dove il testo resta necessario perche' non esiste una pagina stampata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 BookChapterEntryScreen.jsx (Solo Verdict) non renderizza piu' il testo del dilemma, solo le due opzioni di risposta e il resto del flusso (tease, grafico, progress)
- [x] #2 PartyRoomScreen.jsx nasconde room.currentDilemma.dilemma nelle fasi question e reveal esclusivamente quando room.chapterKey e' presente (room creata da un capitolo del libro); le Party Room ordinarie restano invariate
- [x] #3 GET /party-rooms/{code} espone chapterKey (null per le room ordinarie) cosi' il frontend puo' distinguere i due casi senza indovinare
- [x] #4 Test automatico verifica che una room creata con chapterSlug esponga chapterKey e una room ordinaria no
<!-- AC:END -->
