---
id: TASK-190
title: Skill di giro completo dell'app per parti acerbe/rough edges
status: Done
assignee: []
created_date: '2026-08-10 13:41'
updated_date: '2026-08-10 13:43'
labels:
  - tooling
  - quality
dependencies: []
priority: medium
type: feature
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha chiesto un giro completo dell'app per trovare parti 'acerbe' (codice morto, incoerenze, contenuti stantii, ecc.) dopo il redesign del profilo (TASK-177), poi di trasformare quel processo in una skill riusabile (/app-walkthrough), seguendo lo stesso pattern gia' usato da TASK-130 (ops-alerts-sweep). La skill lancia ricerca in parallelo su frontend e backend (agenti dedicati), esclude quanto gia' tracciato in Backlog.md, applica il routing di CLAUDE.md (bug/debito -> Backlog bassa priorita', regressione -> To Do alta priorita' [regression] + nota ADR, decisione -> Open Points, dipendenza mancante -> To Do alta priorita'), dedupe contro task esistenti invece di duplicare, e produce un riepilogo. Non modifica mai codice da sola (stesso principio di sola-lettura di ops-alerts-sweep) - la sessione che la invoca puo' poi scegliere di risolvere i task trovati separatamente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il file .claude/commands/app-walkthrough.md esiste e segue il formato delle altre skill del progetto
- [x] #2 Verificato con l'esecuzione reale di questa sessione (TASK-178..188), non solo scritto in astratto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Creato .claude/commands/app-walkthrough.md seguendo il formato di ops-alerts-sweep.md/routine-serale.md: preflight su backlog task list, ricerca in parallelo (2+ agenti general-purpose, mai Explore), 8 categorie di ricerca generalizzate da quelle usate in questa sessione (incluso il caso 'sembra dead code ma e' scaffolding intenzionale', imparato da TASK-185/LanguageSelector.jsx in questa stessa esecuzione), dedup/arricchimento invece di duplicati, routing secondo la tabella di CLAUDE.md, mai modifica codice. Verificata con l'esecuzione reale di oggi (TASK-178..188 nati da questo stesso processo, prima che la skill venisse scritta - la skill codifica retroattivamente cio' che ha gia' funzionato).
<!-- SECTION:NOTES:END -->
