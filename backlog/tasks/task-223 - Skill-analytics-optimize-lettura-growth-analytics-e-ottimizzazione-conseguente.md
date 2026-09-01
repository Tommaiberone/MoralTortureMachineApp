---
id: TASK-223
title: >-
  Skill analytics-optimize: lettura growth analytics e ottimizzazione
  conseguente
status: Done
assignee: []
created_date: '2026-09-01 12:45'
updated_date: '2026-09-01 12:49'
labels:
  - growth
  - analytics
  - automation
dependencies: []
priority: medium
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
L'utente chiede una skill dedicata per leggere le growth analytics (funnel, retention D1/D7, viral coefficient, A/B test) e agire di conseguenza sui risultati, sul modello di seo-analytics-status.md (TASK-195, sola lettura) ma con un mandato piu' ampio: puo' anche concludere un A/B test con vincitore statisticamente solido (rimuovendo la variante perdente dal codice) e applicare l'escalation stile TASK-166 sui gate di doc-2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuovo .claude/commands/analytics-optimize.md con lo stesso frontmatter/stile delle skill esistenti
- [x] #2 Usa il profilo AWS scoped mtm-analytics-readonly (mai root/--profile personal), con istruzioni esplicite su come verificarlo/crearlo se assente
- [x] #3 Riusa build_analytics_overview e le funzioni sorelle del backend per calcolare le metriche invece di reimplementarle ad-hoc (evita il bug actionType/eventName incontrato in questa sessione)
- [x] #4 Applica un test di significativita' a due proporzioni (formula esplicita nella skill) prima di dichiarare un vincitore in un A/B test, rispettando la soglia minima di campione gia' nel backend
- [x] #5 Instrada nuovi problemi secondo la tabella di CLAUDE.md, dedup contro Backlog.md prima di creare task
- [x] #6 Si ferma per conferma esplicita prima di push che alzano versionCode, coerente col resto del repo
<!-- AC:END -->
