---
id: TASK-106
title: >-
  I link alle pagine nella homepage devono essere invisibili, solo per questioni
  SEO
status: Done
assignee: []
created_date: '2026-07-31 14:54'
updated_date: '2026-08-01 07:35'
labels: []
dependencies: []
priority: high
ordinal: 18000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 I link di risorse SEO nella homepage non sono visibili agli utenti vedenti
- [x] #2 I link restano presenti nel DOM/markup e raggiungibili da crawler e tecnologie assistive (nessun display:none/JS-only injection)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
frontend/src/screens/HomeScreen.css: .home-seo-resource-links ora usa il pattern standard 'sr-only' (position:absolute, 1x1px, clip:rect(0,0,0,0)) invece di testo dim 11px visibile. I tre Link React (verso le landing SEO EN/IT gia' esistenti, ADR-020) restano nel markup con lo stesso testo/href, quindi crawlability e accessibilita' via screen reader non cambiano; solo la resa visiva per utenti vedenti sparisce dalla home.
<!-- SECTION:FINAL_SUMMARY:END -->
