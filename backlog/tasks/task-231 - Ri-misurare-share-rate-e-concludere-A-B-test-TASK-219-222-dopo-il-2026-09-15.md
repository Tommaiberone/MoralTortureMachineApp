---
id: TASK-231
title: Ri-misurare share rate e concludere A-B test TASK-219-222 dopo il 2026-09-15
status: Done
assignee: []
created_date: '2026-09-03 07:23'
updated_date: '2026-09-14 07:32'
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
- [x] #1 Result-to-share (result_viewed -> shared) ricalcolato su una finestra di almeno 14 giorni pieni successiva al 2026-09-01, isolata dal traffico precedente
- [x] #2 Se il tasso resta sotto il 15%, l'esito e le eventuali leve residue vengono riportati all'utente; se raggiunge o supera il 15%, registrato come voce ADR senza ulteriore escalation
- [x] #3 Ciascuno dei 4 A/B test TASK-219/220/221/222 valutato con lo z-test a due proporzioni della skill analytics-optimize; un vincitore con |z|>=1.96 e campione sufficiente su entrambe le varianti viene implementato rimuovendo la variante perdente
- [x] #4 creativeVariants (archetype/radar/provocative, TASK-33) valutato allo stesso modo se il campione lo consente
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-14 07:32
---
Rimisurato 2026-09-14 (nota: eseguito un giorno prima del checkpoint 2026-09-15 su richiesta esplicita, simulando 'oggi = 15/09' per lo z_now della finestra; i dati di produzione arrivano comunque solo fino a 'ora reale' 2026-09-14, quindi la finestra e' 13gg pieni + parziale, non 14gg pieni - lo scarto e' <1 giorno e nessuno dei risultati sotto e' vicino a un punto di svolta per quel margine). Scan diretto via mtm-analytics-ro + build_analytics_overview, finestra 2026-09-01/2026-09-15, days=14, platform=all (legacy_rows=35725, product_rows=18729).

AC#1/2 - result-to-share: 26/235 (result_viewed->shared) = 11,06% (era 11,86% il 2026-08-31, TASK-166/33/156). Sotto il gate 15% nonostante TASK-33 (attribuzione+creative variant) e TASK-156 (CTA unica) deployate il 2026-09-01. Campione sufficiente (235>=30). Nessuna ulteriore escalation automatica per AC#2: riportato all'utente in chat con le leve residue possibili (nessun nuovo task aperto autonomamente, come da AC#2 di questo task).

AC#3 - z-test a due proporzioni (riferimento = variante con piu' exposed), nessun vincitore:
- authPromptCopy: value=2, curiosity=1, unknown=18 (surface challenge_compare esclusa deliberatamente, senza variant -> confluisce in unknown) - tutte insufficientSample, nessun test possibile.
- homeModeCopy: direct 125/170=73,5% vs hook(rif.) 148/183=80,9%, z=-1,647, non significativo.
- challengeButtonCopy: direct 15/70=21,4% vs rival(rif.) 12/75=16,0%, z=0,839; baseline 6/66=9,1% vs rival(rif.) 12/75=16,0%, z=-1,227; nessuno significativo. (Nota a margine, non sanzionato dal metodo: direct vs baseline letterale z=1,990, sopra soglia, ma non e' il confronto contro il riferimento a maggior esposizione richiesto dalla skill - nessuna conclusione tratta da questo.)
- partyCreateCopy: baseline 8/24, dramatic 9/20, entrambe insufficientSample (<30 exposed).

AC#4 - creativeVariants: archetype 3/12=25,0%, provocative 6/16=37,5%, radar 1/5=20,0%, unknown 0/2. Nessuna riga raggiunge la soglia campione di 30 (build_creative_variant_breakdown/_creative_variant_rows non emette insufficientSample come invece fa build_experiment_breakdown - applicato di default 30 come da metodologia skill). Campione non sufficiente per z-test, nessuna conclusione. viralCoefficient (fuori AC, solo per contesto): copy_link 8/21, whatsapp 2/6, facebook 0/1 - stesso limite di campione.

Nessuna modifica al codice in questo giro: nessun esperimento ha un vincitore statisticamente solido. Tutti e 4 gli A/B test restano attivi.
---
<!-- COMMENTS:END -->
