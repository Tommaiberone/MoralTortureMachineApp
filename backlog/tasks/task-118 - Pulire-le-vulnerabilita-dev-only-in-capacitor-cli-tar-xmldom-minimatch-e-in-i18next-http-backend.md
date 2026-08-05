---
id: TASK-118
title: >-
  Pulire le vulnerabilita' dev-only in @capacitor/cli (tar/xmldom/minimatch) e
  in i18next-http-backend
status: Blocked
assignee: []
created_date: '2026-08-01 14:45'
updated_date: '2026-08-05 18:52'
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
- [x] #2 i18next-http-backend e' aggiornato a >=3.0.5
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
i18next-http-backend aggiornato 2.5.2 -> 4.0.1 (AC2 soddisfatta, verificato pnpm lint + build:prod puliti, nessun advisory i18next-http-backend residuo in pnpm audit). @capacitor/cli aggiornato 8.0.0 -> 8.5.0 (ultima versione pubblicata), ma pnpm audit mostra che anche 8.5.0 continua a portare @xmldom/xmldom<0.8.13, minimatch>=10.0.0<10.2.3, @isaacs/brace-expansion<=5.0.0 e uuid<11.1.1 come transitive di native-run/xcode/rimraf>glob interni a capacitor/cli stesso - non esiste oggi una versione pubblicata di @capacitor/cli con queste dipendenze pulite, quindi AC1 non e' pienamente soddisfacibile con un semplice bump (la clausola 'quando disponibile' della sua stessa AC non e' ancora vera). Spostato in Blocked (impedimento esterno upstream) invece di Done; riprendere quando @capacitor/cli rilascia una versione con queste transitive aggiornate.
<!-- SECTION:NOTES:END -->
