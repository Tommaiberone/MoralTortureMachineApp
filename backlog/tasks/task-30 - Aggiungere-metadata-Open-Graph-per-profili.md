---
id: TASK-30
title: Aggiungere metadata Open Graph per profili
status: Blocked
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-01 14:41'
labels:
  - m3-profiles
  - frontend
  - sharing
  - seo
dependencies:
  - TASK-113
documentation:
  - backlog/docs/doc-2
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fornire metadata dinamici o rendering fallback adatto ai crawler senza esporre dati privati.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Preview social punta al profilo corretto
- [ ] #2 Crawler senza JavaScript riceve un fallback utile
- [x] #3 Nessun attributo privato appare nei metadata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Routine serale 2026-08-01: AC1 e AC3 gia' soddisfatti - PublicProfileScreen.jsx passa gia' a <SEO> title/description/url specifici del profilo (nome archetipo + share phrase, entrambi gia' pubblici/teaser) con noindex, nessun attributo privato (nessuna media/token/owner id) nei meta tag. AC2 (fallback per crawler senza JS) resta non soddisfatto: la SPA non ha SSR, react-helmet-async aggiorna i meta tag solo lato client, quindi i bot di anteprima social che non eseguono JS (WhatsApp/Facebook/Twitter/iMessage) vedono ancora i meta tag generici. Risolverlo richiede una decisione di architettura con implicazioni di costo/Free Tier (CloudFront Function/Lambda@Edge vs prerendering vs accettare l'anteprima generica) - creato TASK-113 (Open Points) per quella decisione, da cui questo task ora dipende. Spostato in Blocked in attesa di TASK-113.
<!-- SECTION:NOTES:END -->
