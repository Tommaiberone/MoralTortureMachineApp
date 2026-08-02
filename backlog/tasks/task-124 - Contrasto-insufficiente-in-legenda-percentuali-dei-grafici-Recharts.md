---
id: TASK-124
title: Contrasto insufficiente in legenda/percentuali dei grafici Recharts
status: Done
assignee: []
created_date: '2026-08-02 10:38'
updated_date: '2026-08-02 10:52'
labels:
  - frontend
  - accessibility
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il testo delle percentuali nel pie chart a fine di ogni dilemma (EvaluationDilemmasScreen) e il testo della legenda nei grafici Recharts (pie chart per-dilemma e radar chart in ResultsScreen) restano a basso contrasto: la legenda eredita di default il colore della serie (--horror-crimson / --creepy-pale-green, gli stessi valori gia' identificati come troppo scuri per il testo in TASK-102/107, mai aggiornati qui perche' impostati come colori hardcoded delle fette del pie chart, non tramite le variabili CSS corrette).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Le percentuali mostrate sul pie chart di ogni dilemma sono leggibili (alto contrasto) indipendentemente dallo sfondo su cui cadono
- [x] #2 Il testo della legenda in ogni grafico Recharts dell'app (pie chart valutazione, radar chart risultati) usa un colore ad alto contrasto invece di ereditare il colore della serie
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Causa: il testo della legenda Recharts eredita di default il colore della serie (qui --horror-crimson/pale-green, gli stessi valori gia' segnalati come troppo scuri per il testo in TASK-102/107 - mai toccati qui perche' impostati come colori hardcoded delle fette del pie chart, non tramite le variabili CSS aggiornate), e il testo delle percentuali/degli assi non ha mai un fill esplicito. Fix: due regole globali in shared.css (.recharts-legend-item-text e .recharts-text, con !important perche' Recharts imposta questi colori come stile inline) coprono legenda e assi in ogni grafico dell'app in un colpo solo (pie chart di EvaluationDilemmasScreen e PassThePhoneScreen, radar chart di ResultsScreen). Le percentuali del pie chart avevano bisogno di una label custom (renderPieLabel, stesso codice duplicato nei due screen che condividono il pattern) perche' Recharts non espone un modo diretto di impostare il fill quando si passa una funzione che ritorna solo una stringa. pnpm lint e build:prod puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
