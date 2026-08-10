---
id: TASK-195
title: Skill di stato SEO e analytics
status: Done
assignee: []
created_date: '2026-08-10 14:29'
updated_date: '2026-08-10 14:32'
labels:
  - tooling
  - growth
  - seo
  - analytics
dependencies: []
priority: medium
type: feature
ordinal: 91000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente ha chiesto un'analisi dello stato di SEO e analytics (landing non-brand, Growth Intelligence/Search Console/GA4/PageSpeed, dashboard analytics, ASO), poi di trasformare quel processo in una skill riusabile (/seo-analytics-status), seguendo lo stesso pattern gia' usato da TASK-130 (ops-alerts-sweep) e TASK-190 (app-walkthrough). La skill legge Backlog.md (task/subtask con label seo/aso/analytics/growth), le sezioni Analytics contract e Organic discovery architecture di doc-1, i validation gate di doc-2, il codice (sitemap.xml, robots.txt, seoLandings.js) e l'ultimo run reale del workflow growth-intelligence.yml (via gh run list/download), per produrre un report strutturato: cosa e' live e verificato, cosa e' costruito ma non ancora validato dal traffico reale, e cosa e' bloccato su un'azione esterna del proprietario (Play Console, Data Safety, Keyword Planner/Ads API). E' un report di sola lettura: non modifica codice ne' crea task se non scopre qualcosa di non tracciato, nel qual caso instrada secondo CLAUDE.md come le altre skill di sweep.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il file .claude/commands/seo-analytics-status.md esiste e segue il formato delle altre skill del progetto
- [x] #2 Verificato con l'esecuzione reale di questa sessione (l'analisi SEO/analytics appena prodotta), non solo scritto in astratto
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Creato .claude/commands/seo-analytics-status.md seguendo il formato di ops-alerts-sweep.md/app-walkthrough.md: preflight su backlog task list filtrato per label seo/aso/analytics/growth, verifica nel codice (sitemap/robots/seoLandings.js, consenso GA4) invece di fidarsi dello stato Backlog.md, lettura dell'ultimo run reale growth-intelligence.yml via gh run list/download (nota: python/python3 non disponibile in questa shell Windows, usare Grep/Read sul JSON), instradamento CLAUDE.md per findings non tracciati, riepilogo in 6 sezioni fisse. Verificata con l'esecuzione reale di questa sessione (TASK-97/97.1/97.4.1/63/98 letti in dettaglio, run 31376543998 scaricato e analizzato: split brand/non-brand Search Console, ga4.rows vuoto, pagespeed, demand radar tutto directional, play acquisition/vitals vuoti). doc-1 (Repository workflow) e ADR-084 aggiornati.
<!-- SECTION:NOTES:END -->
