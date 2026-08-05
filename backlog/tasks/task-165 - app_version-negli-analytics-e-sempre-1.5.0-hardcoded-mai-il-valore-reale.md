---
id: TASK-165
title: 'app_version negli analytics e'' sempre 1.5.0 hardcoded, mai il valore reale'
status: To Do
assignee: []
created_date: '2026-08-05 13:43'
labels:
  - bug
  - frontend
  - analytics
  - ci-cd
dependencies: []
priority: medium
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato per caso nei log logcat durante la verifica TASK-18/86/136 (2026-08-05): tutte le richieste analytics/claim dal device (build 17/1.6.2 installata) riportano 'x-app-version':'1.5.0' nell'header, non 1.6.2. Causa: frontend/src/utils/session.js riga 9 - const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.5.0' - VITE_APP_VERSION non e' mai impostata da nessuna parte (verificato con grep sull'intero repo, zero match fuori da session.js), quindi la costante usa sempre il fallback hardcoded '1.5.0', scollegato sia da frontend/package.json version (oggi 1.6.2) sia da versionName in build.gradle. Questo significa che il campo app_version nell'analytics e' probabilmente sbagliato per ogni release da quando questo fallback e' stato scritto, silenziosamente - viola il controllo esplicito richiesto da CLAUDE.md nel protocollo di bump versione ('verificare che l'analytics riporti il nuovo app_version'), che quindi non ha mai davvero funzionato. Impatta la segmentazione per versione di qualunque analisi analytics (es. capire se una nuova feature ha effetto solo dopo un certo aggiornamento).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 VITE_APP_VERSION e' impostata a build time nel job android-build e nel job frontend build/deploy (deploy.yml), lette da frontend/package.json version - stesso pattern gia' usato per VITE_COGNITO_* (vedi bug TASK-18 corretto in precedenza per lo stesso job)
- [ ] #2 Verificato su un build reale (web o Android) che l'header X-App-Version/x-app-version riporti la versione corretta invece del fallback 1.5.0
- [ ] #3 Il fallback hardcoded in session.js resta solo come default per sviluppo locale senza .env, non come valore di produzione
<!-- AC:END -->
