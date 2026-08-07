---
id: TASK-30
title: Aggiungere metadata Open Graph per profili
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-08-07 13:13'
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
- [x] #2 Crawler senza JavaScript riceve un fallback utile
- [x] #3 Nessun attributo privato appare nei metadata
- [x] #4 CloudFront Function (og-bot-router.js) rewrites /p/* to /og/profiles/{publicId}.html only for known link-preview bot user agents; real visitors are unaffected
- [x] #5 POST /profiles writes a pre-rendered HTML snapshot to that S3 key with personalized og:title/og:description (archetype name + share phrase) and noindex, best-effort so a write failure never breaks profile creation
- [x] #6 No new S3 bucket, no Lambda@Edge; only the existing frontend bucket and a least-privilege s3:PutObject IAM statement scoped to og/profiles/*
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Routine serale 2026-08-01: AC1 e AC3 gia' soddisfatti - PublicProfileScreen.jsx passa gia' a <SEO> title/description/url specifici del profilo (nome archetipo + share phrase, entrambi gia' pubblici/teaser) con noindex, nessun attributo privato (nessuna media/token/owner id) nei meta tag. AC2 (fallback per crawler senza JS) resta non soddisfatto: la SPA non ha SSR, react-helmet-async aggiorna i meta tag solo lato client, quindi i bot di anteprima social che non eseguono JS (WhatsApp/Facebook/Twitter/iMessage) vedono ancora i meta tag generici. Risolverlo richiede una decisione di architettura con implicazioni di costo/Free Tier (CloudFront Function/Lambda@Edge vs prerendering vs accettare l'anteprima generica) - creato TASK-113 (Open Points) per quella decisione, da cui questo task ora dipende. Spostato in Blocked in attesa di TASK-113.

2026-08-07 (TASK-113 deciso, ADR-076): implementata la soluzione ibrida. Nuova CloudFront Function (frontend/terraform/functions/og-bot-router.js) su un nuovo ordered_cache_behavior /p/* che rewrite solo per user-agent bot noti verso og/profiles/{publicId}.html; POST /profiles (backend_fastapi.py::_write_profile_og_html) scrive quello snapshot statico su S3 in modo best-effort (try/except, mai blocca la creazione del profilo) con og:title/og:description personalizzati (nome archetipo + share phrase) e noindex; og:image resta quella generica esistente (nessuna pipeline di rendering per-archetipo in questa v1, lasciata come v2 in ADR-076). Nuovo permesso IAM least-privilege s3:PutObject scoped a og/profiles/* sul bucket frontend esistente (backend/terraform, nessun nuovo bucket). Verificato con terraform validate + terraform plan (workspace prod, stesse TF_VAR del workflow CI/CD): frontend 1 da aggiungere/1 da aggiornare, backend 1 modifica reale alla IAM policy (le altre 3 differenze del plan locale erano solo artefatti di segreti OAuth fittizi e zip Lambda vuoto usati solo per il plan locale, non applicati). py_compile e 38 unit test backend puliti. terraform apply non eseguito localmente, come da CLAUDE.md - avverra' via pipeline CI/CD al push.
<!-- SECTION:NOTES:END -->
