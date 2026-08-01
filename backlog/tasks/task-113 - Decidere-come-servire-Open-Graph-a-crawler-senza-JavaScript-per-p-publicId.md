---
id: TASK-113
title: 'Decidere come servire Open Graph a crawler senza JavaScript per /p/:publicId'
status: Open Points
assignee: []
created_date: '2026-08-01 14:41'
updated_date: '2026-08-01 14:41'
labels: []
dependencies:
  - TASK-30
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-30 AC2 ('Crawler senza JavaScript riceve un fallback utile') non e' soddisfatto: il sito e' una SPA Vite senza SSR, i tag Open Graph dinamici per profilo (nome, share phrase) vengono iniettati via react-helmet-async solo lato client dopo l'esecuzione di JS. I bot di anteprima di WhatsApp/Facebook/Twitter/iMessage tipicamente NON eseguono JS: oggi vedrebbero solo i meta tag generici di frontend/index.html, non l'anteprima del profilo condiviso. Serve una decisione di architettura (fuori dall'ambito di una sessione automatica) tra: (a) una CloudFront Function/Lambda@Edge che rileva gli user-agent dei bot noti e serve HTML pre-renderizzato con i meta tag corretti per /p/:publicId (richiede anche generare un'immagine OG per-profilo lato server, oggi la share card e' generata solo client-side su canvas, ADR-034/047); (b) prerendering statico piu' ampio (gia' menzionato come valutazione futura in ADR-020 per le landing SEO); (c) accettare per ora un'anteprima generica e rivisitare solo se emergono evidenze di impatto sulla conversione dei link condivisi. Ognuna ha implicazioni di costo/Free Tier e complessita' diverse.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E' stata scelta esplicitamente una delle opzioni (o un'alternativa) con il relativo trade-off di costo/Free Tier documentato in un ADR
- [ ] #2 Se scelta un'opzione con nuovo servizio AWS, e' stata seguita la procedura di eccezione Free Tier di CLAUDE.md prima di provisionare
<!-- AC:END -->
