---
id: TASK-33
title: Attribuire link condivisi e testare creatività
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-09-01 10:41'
labels:
  - m3-profiles
  - analytics
  - experiment
  - growth
dependencies:
  - TASK-6
  - TASK-32
documentation:
  - backlog/docs/doc-2
priority: high
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Attribuzione anonima di origine/canale e A-B test tra radar, archetipo e frase provocatoria.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni link conserva source e creative senza identità
- [x] #2 La variante resta persistente
- [x] #3 La conversione downstream è visibile in analytics
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-31 15:11
---
TASK-166 rimisurato 2026-08-31: share rate su finestra pulita 2026-08-06/2026-08-31 (25.6gg, post-fix TASK-149) = 56/472 = 11,86% (era 3,4% il 2026-08-05, in miglioramento ma ancora sotto il gate 15%). Escalation automatica ad Alta priorita' per protocollo TASK-166 AC#2.
---

created: 2026-09-01 10:41
---
Implementato 2026-09-01: frontend/src/utils/attribution.js (withShareAttribution per utm_source/medium/campaign/content, getShareCreativeVariant per il bucketing deterministico su anonymousUserId). Applicato a tutti i link di condivisione Duel (ResultsScreen, ChallengeLandingScreen, ChallengeCompareScreen). 3 varianti creative per l'invito (archetype/radar/provocative) con relativi copy in en.json. Backend: build_creative_variant_breakdown espone la conversione per variante in GET /admin/analytics/overview come creativeVariants, visibile nel nuovo tab Growth.
---
<!-- COMMENTS:END -->
