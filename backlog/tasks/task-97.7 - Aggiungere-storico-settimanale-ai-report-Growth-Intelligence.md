---
id: TASK-97.7
title: Aggiungere storico settimanale ai report Growth Intelligence
status: Done
assignee: []
created_date: '2026-07-31 09:28'
labels:
  - growth
  - seo
  - analytics
  - automation
dependencies: []
parent_task_id: TASK-97
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Confrontare report aggregati recenti tramite artifact GitHub Actions read-only, per rilevare trend di query senza database o AWS.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il workflow legge in sola lettura gli artifact privati recenti e conserva quelli nuovi per 90 giorni.
- [x] #2 Il report mostra il numero di settimane confrontate e raccomandazioni per crescita o calo significativo solo con campione minimo.
- [x] #3 Il mancato download dello storico non blocca il report corrente.
<!-- AC:END -->

## Implementation Notes

Implementato localmente 2026-07-31: il comando `history` usa soltanto la API
GitHub Actions con token read-only, scarica gli artifact non scaduti, estrae una
sintesi query aggregata e non blocca mai il report se la fonte non è
disponibile. Il workflow richiede `actions: read`, passa il token al comando e
porta la retention a 90 giorni. I test unitari coprono download/sintesi e
fallback; resta da verificare una run GitHub Actions sul commit contenente
questa modifica.

Verificato 2026-08-04 sul report generato il 2026-08-03: storico in stato
`ok` con otto report precedenti; nessuna raccomandazione di trend è emersa
senza un campione non-brand sufficiente. Il report corrente è stato comunque
generato con errori di fonti ASO non fatali.
