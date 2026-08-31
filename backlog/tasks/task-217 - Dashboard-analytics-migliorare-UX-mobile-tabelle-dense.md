---
id: TASK-217
title: 'Dashboard analytics: migliorare UX mobile tabelle dense'
status: Done
assignee: []
created_date: '2026-08-31 13:48'
updated_date: '2026-08-31 13:59'
labels: []
dependencies: []
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Le due tabelle dense della dashboard (abuso: 9 colonne, eventi recenti: 8 colonne con dettagli <details> annidati) restano scroll-orizzontali puri sotto i 45rem/28rem esistenti: usabili ma scomode per una review da telefono, a differenza del resto della dashboard che si adatta bene (KPI grid, grafici, sidebar a tab orizzontali gia' sistemati da TASK-128/189). Non e' stato possibile verificare visivamente nel browser (vietato da CLAUDE.md); il fix va rivisto manualmente dall'utente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sotto ~45rem le due tabelle dense passano a un layout a card impilate (una riga = una card con etichetta/valore) invece di scroll orizzontale puro, oppure le colonne meno critiche vengono nascoste/spostate in un dettaglio espandibile
- [x] #2 Nessuna informazione viene persa, solo riorganizzata per lo schermo stretto
- [x] #3 pnpm lint e pnpm build:prod passano; utente informato che serve un controllo manuale su dispositivo reale
<!-- AC:END -->
