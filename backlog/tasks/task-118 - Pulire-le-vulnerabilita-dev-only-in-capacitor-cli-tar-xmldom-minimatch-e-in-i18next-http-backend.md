---
id: TASK-118
title: >-
  Pulire le vulnerabilita' dev-only in @capacitor/cli (tar/xmldom/minimatch) e
  in i18next-http-backend
status: To Do
assignee: []
created_date: '2026-08-01 14:45'
labels:
  - security
  - dependency
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
pnpm audit segnala molte CVE (alcune high) in tar/@xmldom/xmldom/minimatch/@isaacs/brace-expansion, tutte transitive di @capacitor/cli: e' uno strumento di build usato solo in locale/CI per generare il progetto Android (npx cap sync/build), non spedito nel bundle web ne' nell'app - rischio reale basso (serve processare un archivio tar malevolo durante una build) ma va comunque aggiornato quando @capacitor/cli rilascia una versione con dipendenze pulite. i18next-http-backend <3.0.5 ha invece un path traversal/URL injection via lng/ns non sanificati ed e' codice di runtime (carica i file di traduzione), quindi ha priorita' leggermente piu' alta delle altre di questo task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 @capacitor/cli e' aggiornato a una versione senza le CVE elencate quando disponibile, senza cambiare la configurazione Android esistente
- [ ] #2 i18next-http-backend e' aggiornato a >=3.0.5
<!-- AC:END -->
