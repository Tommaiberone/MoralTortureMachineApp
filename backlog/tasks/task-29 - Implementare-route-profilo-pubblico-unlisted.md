---
id: TASK-29
title: Implementare route profilo pubblico unlisted
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:16'
labels:
  - m3-profiles
  - frontend
  - privacy
  - web
  - android
dependencies:
  - TASK-28
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Aggiungere /p/:publicId con caricamento diretto, refresh e CTA primaria per sfidare il profilo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deep link e refresh aprono lo stesso profilo
- [x] #2 Il profilo è unlisted per default
- [x] #3 La CTA challenge conserva attribution
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PublicProfileScreen.jsx su /p/:publicId: fetch diretto per ID ad ogni mount (deep link e refresh risolvono sempre lo stesso profilo, nessuno stato client richiesto - AC1). Unlisted per default: nessun endpoint di listing/ricerca esiste, solo GET /profiles/{id} per token non enumerabile (AC2). CTA 'Fai il test anche tu' traccia profile_cta_clicked con public_id PRIMA di navigare (attribution, AC3) e porta al tutorial/evaluation flow. Scope deliberatamente limitato: la CTA non crea automaticamente una sfida diretta contro il profilo di uno sconosciuto (richiederebbe consenso del proprietario, che il modello POST /challenges gia' impone); il loop di sfida completo resta quello via /challenge/:token (TASK-38/39).
<!-- SECTION:NOTES:END -->
