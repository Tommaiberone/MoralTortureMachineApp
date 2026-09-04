---
id: TASK-235
title: Applicare lo stile dossier al recap Party Room (PartyRoomScreen completed)
status: Backlog
assignee: []
created_date: '2026-09-04 10:15'
labels:
  - frontend
  - design
  - party-room
dependencies: []
priority: medium
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Estendere il restyling 'dossier/verdetto' (TASK-233/234, Artifact 'Verdict Cards' https://claude.ai/code/artifact/4ad2e427-8fd9-4343-9791-f3e8da531724) alla sequenza finale di PartyRoomScreen.jsx/.css (room.status === 'completed': archetipi, radar personale, archetipo di gruppo, verdetto AI, award, azioni). Applicare lo stesso sistema (tipografia, glow, grana, barre etichetta-sopra/barra-sotto) mantenendo il flow a stadi con bottoni Indietro/Avanti e titolo fissato gia' implementati in questa stessa sessione (TASK-209/210/211 + follow-up). Dipende da TASK-234 per riusare lo stesso approccio di caricamento font/scoping gia' validato la' prima.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 La sequenza finale di Party Room applica il sistema dossier mantenendo stadi, bottoni Indietro/Avanti, titolo fissato e tutti i dati esistenti (archetipi, radar personale, archetipo di gruppo, verdetto, award)
- [ ] #2 Le barre/elementi statistici (radar, dimensioni) non hanno testo coperto da elementi colorati
- [ ] #3 pnpm lint e pnpm build:prod passano; nessun controllo browser live, verificato via code review
<!-- AC:END -->
