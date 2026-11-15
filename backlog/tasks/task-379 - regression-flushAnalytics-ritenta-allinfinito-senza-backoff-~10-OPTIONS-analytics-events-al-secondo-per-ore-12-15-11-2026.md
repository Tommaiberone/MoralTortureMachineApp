---
id: TASK-379
title: >-
  [regression] flushAnalytics ritenta all'infinito senza backoff: ~10 OPTIONS
  /analytics/events al secondo per ore (12-15/11/2026)
status: Done
assignee: []
created_date: '2026-11-15 12:57'
updated_date: '2026-11-15 13:06'
labels:
  - bug
  - analytics
  - cost
dependencies: []
priority: high
ordinal: 280000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dal 12 al 15/11/2026 l'API ha ricevuto 230-245 mila richieste al giorno invece di 1-6 mila: quasi tutte OPTIONS /analytics/events (229.070 il 12/11 contro 539 POST), a blocchi di ore, da quello che sembra un solo client. Quando la fetch fallisce a livello di rete (qui dopo il preflight: blocco lato client, proxy o simili) flushAnalytics rimette il batch in coda e, con almeno 25 eventi, si richiama subito: un loop al ritmo del round trip. La coda sta in sessionStorage, quindi sopravvive al reload. Costo: ~0,60 USD in 4 giorni, scattato l'allarme del budget di account. Causa del regresso: il richiamo immediato per svuotare la coda (pensato per i successi) scatta anche dopo un fallimento.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dopo un invio fallito (rete, 429, 5xx) il tentativo successivo aspetta un backoff esponenziale da 5 s a 5 min, e il richiamo immediato avviene solo dopo un invio riuscito
- [x] #2 keepalive solo per l'invio su pagehide/visibilitychange hidden
- [x] #3 pnpm lint e pnpm build:prod passano
- [x] #4 Versione 1.13.0 -> 1.13.1 in package.json e versionName; versionCode resta 32 finché l'utente non conferma il rilascio Android
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Backoff esponenziale 5 s-5 min dopo un invio fallito, richiamo immediato solo dopo un successo, keepalive solo su pagehide/hidden (ADR-165). Versione 1.13.1 per il web; versionCode 32 invariato: l'APK resta col vecchio loop finché l'utente non conferma un rilascio Android. Lint e build:prod passano; verifica nel browser non fatta (regola del repo).
<!-- SECTION:FINAL_SUMMARY:END -->
