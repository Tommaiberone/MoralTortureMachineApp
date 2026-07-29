---
id: TASK-97
title: Costruire SEO intelligence read-only con Search Console e GA4
status: In Progress
assignee: []
created_date: '2026-07-29 13:57'
updated_date: '2026-07-29 15:08'
labels:
  - growth
  - seo
  - analytics
  - automation
dependencies:
  - TASK-6
  - TASK-63
references:
  - frontend/SEO_IMPLEMENTATION.md
documentation:
  - backlog/docs/doc-2
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raccogliere con cadenza settimanale dati read-only da Google Search Console (query, pagina, dispositivo, paese, impressioni, CTR e posizione), GA4 (landing page, canale organico e conversione verso il primo risultato) e PageSpeed Insights. Calcolare opportunità prioritarie e creare un report/proposta revisionabile; il sistema non pubblica né modifica contenuti, metadata, sitemap o infrastruttura automaticamente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 #1 Search Console è la fonte di query, impressioni, CTR e posizione; GA4 misura solo il comportamento e le conversioni post-clic.
- [x] #2 #3 Il report individua almeno: query con molte impressioni e CTR basso, pagine in posizione 8-20, mismatch landing-to-completion e regressioni tecniche/Core Web Vitals.
- [x] #3 #4 Ogni proposta include evidenza, impatto stimato, rischio e file/pagina interessati; l'esito è una issue o una bozza di PR, mai una pubblicazione automatica.
- [ ] #4 #5 L'implementazione rispetta consenso/privacy: nessuna email, user ID, risposta ai dilemmi o dato personale viene trasmesso a GA4.
- [x] #5 #6 Il report evidenzia la limitazione dei dati Search Console (top rows/aggregati) e usa una finestra mobile di almeno 28 giorni.
- [x] #6 #2 Il job usa GitHub OIDC e un service account Google senza chiavi statiche, vincolato al solo repository; le credenziali non raggiungono frontend o AWS.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Aggiornamento 2026-07-29: TASK-6 verificato e chiuso. Per abilitare il tag GA4 nel browser resta necessario TASK-63 (consenso/privacy); il report read-only Search Console/PageSpeed/ASO può funzionare senza tag GA4.

Implementato 2026-07-29: scripts/growth_intelligence.py, workflow .github/workflows/growth-intelligence.yml, artifact privato 14 giorni e issue solo su dispatch manuale. Bloccato soltanto da: proprietà/permessi Google e TASK-63 prima di inserire il tag GA4 nel browser.

Ripreso 2026-07-29: configurata federazione GitHub OIDC sul progetto Google Cloud moraltorturemachine; migrazione del workflow da secret JSON a token brevi in corso.

OIDC verificato 2026-07-29: provider GitHub ACTIVE, vincolo repository applicato e Analytics Data/Search Console/Play Reporting API abilitate nel progetto moraltorturemachine. Restano solo le autorizzazioni product-level e TASK-63 per il tag GA4.
<!-- SECTION:NOTES:END -->
