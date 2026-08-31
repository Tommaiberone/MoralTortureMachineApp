---
id: TASK-208
title: >-
  [regression] DailyMoralCrimeScreen crashes with TypeError reading dilemma on
  initial render
status: Done
assignee: []
created_date: '2026-08-31 09:47'
updated_date: '2026-08-31 10:08'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segnalato dall'utente in produzione (moraltorturemachine.com): DailyMoralCrimeScreen crasha con 'TypeError: Cannot read properties of null (reading 'dilemma')', catturato dall'ErrorBoundary. Causa: in DailyMoralCrimeScreen.jsx, il calcolo di selectedAnswer (righe 131-134) accedeva a 'daily.dilemma' senza optional chaining su 'daily' stesso nel ramo ':' del ternario ('daily.dilemma?.secondAnswer' invece di 'daily?.dilemma?.secondAnswer'). Questo codice gira SENZA guardia (fuori dal blocco '{!loading && daily && (...)}') su OGNI render, e 'daily' parte da null (useState(null)) - quindi crasha al primissimo render, prima ancora che la fetch a /daily-moral-crime risponda, per il 100% delle visite. Il bug e' nel codice committato da TASK-42/43/44 (2026-08-10, commit a1c26b3) ma non era mai stato osservato prima perche' l'intera pipeline di deploy era rotta dallo stesso commit fino al fix di TASK-206 (2026-08-31): la feature non era mai stata davvero live. Il fix di TASK-206 ha reso Daily Moral Crime raggiungibile per la prima volta, esponendo questo bug latente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 DailyMoralCrimeScreen renders initial loading and prompt states without throwing TypeError when daily is null
- [x] #2 selectedAnswer safely evaluates to undefined before daily data is loaded (daily?.dilemma?.firstAnswer / daily?.dilemma?.secondAnswer, entrambi i rami)
- [x] #3 pnpm lint e pnpm build:prod passano
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fix: aggiunto '?.' dopo 'daily' in entrambi i rami del ternario (frontend/src/screens/DailyMoralCrimeScreen.jsx righe 132-134): 'daily?.dilemma?.firstAnswer' / 'daily?.dilemma?.secondAnswer'. Diff minimale (2 righe), nessun'altra modifica. Verificato che non esistono altri accessi 'daily.xxx' non protetti fuori dal blocco guardato '{!loading && daily && (...)}' nello stesso file (grep completo eseguito). pnpm lint pulito, pnpm build:prod pulito. Nota: nel working tree locale era presente anche una riga duplicata e sintatticamente invalida (una seconda coda di ternario orfana) non presente in HEAD/produzione - rimossa insieme al fix vero.

Inclusa anche una piccola modifica gia' presente nel working tree locale (non collegata al crash frontend): vote_daily_moral_crime ora logga anche error.response['Error']['Message'] oltre al Code quando la transazione DynamoDB fallisce (backend_fastapi.py), per diagnosticare piu' facilmente futuri 503 'Daily vote recording is temporarily unavailable' - sicuro da loggare (messaggio di errore lato AWS sulla transazione, non contenuto lato client). 184 test backend verdi, py_compile pulito. Version bump: 1.7.3 -> 1.7.4, versionCode 23 -> 24 (fix urgente di un crash al 100% delle visite, packaged web code).

Deploy confermato: run 33380623870, tutti i job verdi incluso 'Publish to Google Play (production)' - fix live su web (S3/CloudFront) e versione 1.7.4/24 pubblicata su Play Store.
<!-- SECTION:FINAL_SUMMARY:END -->
