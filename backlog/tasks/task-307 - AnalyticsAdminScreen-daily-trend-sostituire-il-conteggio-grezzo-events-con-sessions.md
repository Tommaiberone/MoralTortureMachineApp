---
id: TASK-307
title: >-
  AnalyticsAdminScreen daily trend: sostituire il conteggio grezzo 'events' con
  'sessions'
status: Done
assignee: []
created_date: '2026-09-18 08:30'
updated_date: '2026-09-18 08:31'
labels: []
dependencies: []
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il daily trend (frontend/src/screens/AnalyticsAdminScreen.jsx) plotta events come conteggio grezzo di tutti gli eventi del giorno. E' un marker poco sensato perche' dominato da answer_selected, che spara una volta per ogni dilemma risposto (fino a MAX_DILEMMAS volte a test) mentre quasi tutti gli altri eventi sparano una volta a sessione: la linea riflette soprattutto quante domande in media si completano per sessione, non crescita/uso, e puo' salire quando MENO persone abbandonano prima. Il backend calcola gia' sessions per ogni giorno (build_analytics_overview, daily[day_key]['sessions']) ma non viene plottato. Sostituire la linea events con sessions nel LineChart (dataKey, label i18n, eventuale colore), lasciando invariato il campo backend 'events' che resta usato altrove (abuse monitoring peakEventsPerDay, eventsByType nel pannello funnel).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La LineChart del pannello Trends in AnalyticsAdminScreen.jsx plotta sessions al posto di events, con label i18n dedicata in en.json
- [x] #2 Il campo backend events nella daily trend response non viene rimosso (resta usato da abuse monitoring / eventsByType)
- [x] #3 pnpm lint e pnpm build:prod passano
<!-- AC:END -->
