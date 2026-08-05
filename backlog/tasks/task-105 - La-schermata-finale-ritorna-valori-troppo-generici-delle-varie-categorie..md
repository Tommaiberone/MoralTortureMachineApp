---
id: TASK-105
title: La schermata finale ritorna valori troppo generici delle varie categorie.
status: Done
assignee: []
created_date: '2026-07-31 14:54'
updated_date: '2026-08-05 08:53'
labels: []
dependencies: []
priority: medium
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Come possiamo risolvere? Studiamo una soluzione intelligente
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il grafico radar dei risultati usa una scala fissa [0,1] invece di autoscalare al massimo di ciascun utente, cosi' i punteggi sono confrontabili tra persone diverse invece di sembrare sempre 'pieni'
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-05: root cause principale trovata in ResultsScreen.jsx - PolarRadiusAxis usava domain={[0,'auto']}, quindi Recharts scalava il raggio al valore massimo di CIASCUN utente: chiunque finiva con un esagono visivamente 'pieno' a percentuali diverse dell'area del grafico, a prescindere dal punteggio assoluto (0.4 o 0.9 apparivano ugualmente 'alti'). fullMark calcolato (maxAverage*1.2) non era nemmeno collegato al domain, quindi era codice morto. Fix: domain fisso [0,1], corretto perche' ogni punteggio per dimensione e' sempre in quel range (verificato su tutti i 204 valori in backend/data/dilemmas_en.json). Lint + build puliti. Nessuna modifica a scoring/archetipi: solo la scala di visualizzazione del grafico. Trovate pero' anche due cause piu' profonde che NON sono bug e richiedono una decisione di prodotto (toccano il contratto deterministico/versionato degli archetipi, ADR-025): le 6 dimensioni (Empathy/Integrity/Responsibility/Justice/Altruism/Honesty) sono fortemente correlate tra loro nei 17 dilemmi attuali (es. Integrity/Justice/Honesty correlano 0.65-0.86), quindi ogni radar tende alla stessa forma; e la media su 7 dilemmi regredisce verso il centro della popolazione (banda 0.56-0.70) a meno di risposte molto coerenti. Aperto TASK-142 (Open Points) per la decisione, non implementato qui.
<!-- SECTION:NOTES:END -->
