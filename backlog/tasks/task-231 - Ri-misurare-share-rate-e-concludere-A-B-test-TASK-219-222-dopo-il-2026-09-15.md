---
id: TASK-231
title: Ri-misurare share rate e concludere A-B test TASK-219-222 dopo il 2026-09-15
status: To Do
assignee: []
created_date: '2026-09-03 07:23'
labels:
  - growth
  - analytics
  - experiment
dependencies:
  - TASK-33
  - TASK-156
  - TASK-219
  - TASK-220
  - TASK-221
  - TASK-222
documentation:
  - backlog/docs/doc-2
priority: medium
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sei un growth analyst scettico: TASK-33 (attribuzione/creative variants) e TASK-156 (CTA share primaria unica) sono stati deployati il 2026-09-01, stesso giorno dei 4 A/B test TASK-219/220/221/222 (auth_prompt_copy, home_mode_copy, challenge_button_copy, party_create_copy). La run di analytics-optimize del 2026-09-03 (ADR-106) ha trovato: result-to-share ancora 11,8% su una finestra 30gg che copre quasi solo il periodo pre-TASK-33/156 (troppo presto per vedere l'effetto); tutti e 4 gli A/B test e i creativeVariants con insufficientSample=true su ogni variante taggata tranne un bucket unknown/untagged dominante (traffico pre-strumentazione). Non lavorare su questo task prima del 2026-09-15 (14 giorni pieni dopo il deploy del 2026-09-01): prima di quella data il campione e' insufficiente per qualunque conclusione. Quando arrivi a quella data, rilancia la skill analytics-optimize (o ripeti lo scan diretto documentato li') per: ricalcolare result-to-share isolando la finestra 2026-09-01/oggi; valutare ciascuno dei 4 A/B test con lo z-test a due proporzioni gia' definito nella skill; valutare creativeVariants (archetype/radar/provocative) allo stesso modo se il campione lo consente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Result-to-share (result_viewed -> shared) ricalcolato su una finestra di almeno 14 giorni pieni successiva al 2026-09-01, isolata dal traffico precedente
- [ ] #2 Se il tasso resta sotto il 15%, l'esito e le eventuali leve residue vengono riportati all'utente; se raggiunge o supera il 15%, registrato come voce ADR senza ulteriore escalation
- [ ] #3 Ciascuno dei 4 A/B test TASK-219/220/221/222 valutato con lo z-test a due proporzioni della skill analytics-optimize; un vincitore con |z|>=1.96 e campione sufficiente su entrambe le varianti viene implementato rimuovendo la variante perdente
- [ ] #4 creativeVariants (archetype/radar/provocative, TASK-33) valutato allo stesso modo se il campione lo consente
<!-- AC:END -->
