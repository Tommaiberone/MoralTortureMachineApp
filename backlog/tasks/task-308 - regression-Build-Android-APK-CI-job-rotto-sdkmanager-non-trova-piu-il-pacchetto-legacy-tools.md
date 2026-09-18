---
id: TASK-308
title: >-
  [regression] Build Android APK CI job rotto: sdkmanager non trova piu' il
  pacchetto legacy 'tools'
status: To Do
assignee: []
created_date: '2026-09-18 08:38'
updated_date: '2026-09-18 08:38'
labels: []
dependencies: []
priority: high
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il job 'Build Android APK' in .github/workflows/deploy.yml (step 'Setup Android SDK', android-actions/setup-android@v3, riga ~464, nessun 'packages:' esplicito quindi usa il default dell'azione) fallisce da oggi con 'Warning: Failed to find package tools' ed exit code 1 su 'sdkmanager tools'. Confermato regressivo: la stessa pipeline (run 34823091389, push del 2026-09-14) aveva completato questo job con successo; il primo fallimento osservato e' il run 35324945875 (push TASK-307, 2026-09-18), che pero' non tocca alcun file Android/CI - causa esterna, non del commit. Causa probabile: Google ha rimosso/deprecato il pacchetto SDK legacy 'tools' dal repository remoto, quindi qualunque richiesta implicita di 'tools' (default dell'azione setup-android@v3) ora fallisce per ogni build, non solo per questa. Effetto pratico finora: Deploy Backend (prod) e Build & Deploy Frontend (prod) hanno completato con successo in entrambi i run - il web/backend e' stato deployato regolarmente; solo la build APK/AAB e il relativo commento con link di download non sono stati prodotti. Nessun impatto sul prodotto pubblicato finche' non serve una nuova APK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Il job 'Build Android APK' completa con successo su un push che non tocca file Android (replica del problema con packages: espliciti, es. 'platform-tools' + le build-tools/platforms realmente richieste da frontend/android, senza il pacchetto legacy 'tools')
- [ ] #2 Il fix e' verificato con un run reale della pipeline (push o workflow_dispatch) che produce APK/AAB e il commento con link di download
- [x] #3 La causa e la correzione sono registrate come voce ADR in decision-1
<!-- AC:END -->
