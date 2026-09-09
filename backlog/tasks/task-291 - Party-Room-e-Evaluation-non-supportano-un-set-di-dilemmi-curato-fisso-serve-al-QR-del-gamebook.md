---
id: TASK-291
title: >-
  Party Room e Evaluation non supportano un set di dilemmi curato/fisso (serve
  al QR del gamebook)
status: To Do
assignee: []
created_date: '2026-09-09 13:45'
updated_date: '2026-09-09 13:45'
labels: []
dependencies: []
priority: high
type: feature
ordinal: 187000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scoperto scrivendo il mini-libro di TASK-292: il design scelto per il gamebook fisico prevede due QR per capitolo (5 dilemmi, stesso tema) - uno apre una sessione Evaluation solitaria con quei 5 dilemmi, l'altro crea una Party Room con quegli stessi 5 dilemmi. Verificato nel codice che oggi nessuno dei due flussi supporta un set di id fissato dal chiamante: create_party_room (backend_fastapi.py:3262) chiama sempre _pick_random_dilemma_base_ids (riga 3090), che sceglie N dilemmi a caso via random.sample; get_dilemma (riga 5274, usato dall'Evaluation solista) restituisce un dilemma casuale alla volta escludendo solo quelli gia' visti (parametro exclude). get_dilemmas_by_ids (riga 2436) esiste ma serve solo a servire all'invitato di un Duel lo stesso set gia' salvato sul profilo del creatore, non a inizializzare una nuova sessione da un elenco fornito dal client. Senza questa capacita', scansionare il QR di un capitolo stampato non apre gli stessi 5 dilemmi stampati sulla pagina, ma un set diverso ogni volta - il meccanismo centrale del libro non funzionerebbe. I QR nel mini-libro di TASK-292 restano segnaposto in attesa di questo lavoro.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CreatePartyRoomRequest guadagna un modo per specificare un set fisso di dilemma base id (es. via uno slug di capitolo lato server, o una lista esplicita) che bypassa _pick_random_dilemma_base_ids quando presente, senza rompere la creazione random esistente per le party room ordinarie
- [ ] #2 Esiste un modo equivalente per avviare una sessione Evaluation solitaria con lo stesso set fisso e ordinato di dilemmi, invece del flusso get_dilemma a estrazione casuale
- [ ] #3 Il mapping slug-capitolo -> lista di dilemma base id vive in un posto solo, condiviso tra generazione del QR (book/) e backend, cosi' i due non possono andare fuori sincro
- [ ] #4 Verificato con un test end-to-end che scansionare il QR solo e quello party dello stesso capitolo producano entrambi la stessa identica sequenza di 5 dilemmi
<!-- AC:END -->
