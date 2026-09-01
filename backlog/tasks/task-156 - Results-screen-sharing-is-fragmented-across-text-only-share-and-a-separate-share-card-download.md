---
id: TASK-156
title: >-
  Results screen sharing is fragmented across text-only share and a separate
  share-card download
status: Done
assignee: []
created_date: '2026-08-05 09:07'
updated_date: '2026-09-01 10:41'
labels:
  - frontend
  - growth
  - sharing
dependencies: []
priority: high
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ResultsScreen.jsx WhatsApp/Facebook buttons (lines 267-294) send a text-only message, while the richer canvas share card added by TASK-133 (lines 297-315) is a separate download the user must manually attach in a different app - no single flow produces the card, ready to send. Matters for the result-to-share rate growth gate in doc-2 (target >=15%). Verified by reading the file directly (TASK-111 UX audit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La sezione di condivisione generica in ResultsScreen ha un'unica azione primaria (card formato stories via shareOrDownloadCard) che su dispositivi capaci apre lo share sheet nativo con immagine+testo pronti in un solo tap, invece di richiedere di scegliere fra bottoni scollegati
- [x] #2 WhatsApp/Facebook/formato square restano disponibili come opzioni secondarie de-enfatizzate, non rimosse (nessuna funzionalita' persa)
- [x] #3 Il testo che accompagna la card condivisa include un link tracciabile (TASK-33), cosi' anche chi riceve la card puo' essere attribuito
- [x] #4 Nuove chiavi i18n solo in en.json (it.json drift exception, CLAUDE.md 2026-08-02)
- [x] #5 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-31 15:12
---
TASK-166 rimisurato 2026-08-31: share rate su finestra pulita 2026-08-06/2026-08-31 (25.6gg, post-fix TASK-149) = 56/472 = 11,86% (era 3,4% il 2026-08-05, in miglioramento ma ancora sotto il gate 15%). Escalation automatica ad Alta priorita' e To Do per protocollo TASK-166 AC#2.
---

created: 2026-09-01 10:41
---
Implementato 2026-09-01: card formato stories via shareOrDownloadCard e' ora l'azione primaria (btn-primary, un tap = share sheet nativo con immagine+testo se supportato), WhatsApp/Facebook/formato square restano come opzioni secondarie de-enfatizzate sotto un'etichetta 'or share another way'. Testo della card ora include un link con attribuzione UTM (TASK-33).
---
<!-- COMMENTS:END -->
