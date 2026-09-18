---
id: TASK-309
title: >-
  POST /analyze-results: burst di 5 429 (rate limit 'ai') in ~2s il 2026-09-12,
  causa non confermabile solo dal codice
status: Done
assignee: []
created_date: '2026-09-18 08:38'
updated_date: '2026-09-18 09:13'
labels:
  - bug
  - backend
  - rate-limit
dependencies: []
priority: low
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Trovato durante ops-alerts-sweep (2026-09-18): 6 righe (429, /analyze-results) in prod-moral-torture-machine-ops-error-alerts, 5 delle quali in un cluster di ~2s (2026-09-12T04:04:22.805-04:04:24.764) piu' 1 isolata (2026-09-15T16:14:40). La regola 'ai' (ABUSE_AI_REQUESTS_PER_MINUTE, default 12/min, chiave IP-only via _rate_limit_source, condivisa con /generate-dilemma) implica che la stessa sorgente aveva gia' consumato la quota residua nello stesso minuto (fino a ~17 richieste totali in <60s) - piu' di quanto un singolo caricamento di ResultsScreen dovrebbe generare. ResultsScreen.jsx: l'useEffect fetchAiAnalysis (righe ~100-147) dipende da [answers, dilemmasWithChoices, i18n.language, t], entrambi letti da location.state con fallback a un nuovo oggetto {answers: [], dilemmasWithChoices: []} se location.state e' assente; in navigazione normale answers/dilemmasWithChoices restano stabili tra i render della stessa location, quindi non e' stato possibile confermare un loop di re-render dal solo codice statico. Ipotesi non escluse: (a) bot/scanner che colpisce ripetutamente un endpoint a costo AI (rilevante per i vincoli di costo Groq free tier in CLAUDE.md), (b) refresh/retry manuale ravvicinato da un utente reale, (c) un bug di re-render non riprodotto in questa analisi. Bassa priorita' perche' la rate limit guard ha comunque funzionato come previsto (nessun danno visibile all'utente oltre al messaggio rate_limit_error), e una sola sessione con cluster osservato non e' ancora un pattern confermato - stessa logica di TASK-290.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Correlare (via CloudWatch logs o nuove occorrenze future) se il cluster deriva da una singola sorgente/sessione con un client bug, o da traffico bot/scanner non correlato
- [ ] #2 Se confermato un loop lato client in ResultsScreen.jsx, identificare e correggere la dipendenza instabile nello useEffect di fetchAiAnalysis
- [x] #3 Se confermato traffico bot/scanner o giudicato troppo raro/basso impatto, chiudere il task con la motivazione registrata
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Chiuso su richiesta esplicita dell'utente di risolvere subito i task collegati alla sweep, tramite il ramo AC#3 gia' previsto dal task stesso (nessuna nuova evidenza raccolta oggi - il task e' stato creato nella stessa sessione, poche ore fa). Non e' stato possibile un fix di codice: ResultsScreen.jsx's fetchAiAnalysis useEffect dipende da [answers, dilemmasWithChoices, i18n.language, t] - in navigazione normale (location.state presente) answers/dilemmasWithChoices sono referenzialmente stabili tra i render della stessa location, quindi non e' stato identificato alcun loop di re-render riproducibile dal solo codice statico; i18n e' forzato a 'en' senza LanguageDetector (TASK-101), quindi non c'e' un cambio lingua post-init che possa rifar scattare l'effetto. Nessun accesso a CloudWatch Logs dal profilo AWS scoped di questa skill (mtm-ops-alerts-writer: solo dynamodb Scan/DeleteItem/DescribeTable + sns:Publish) per correlare la sorgente della richiesta, e CLAUDE.md vieta l'uso del profilo root 'personal' per automazione di routine. Decisione: rischio accettato come basso impatto - la rate limit guard ha funzionato esattamente come previsto (nessun danno visibile, nessun costo AI aggiuntivo oltre alla quota consumata), un solo cluster osservato in oltre due settimane di dati, nessuna recidiva nei 6 giorni successivi fino a questa sweep. Le 6 righe (429, /analyze-results) restano in prod-moral-torture-machine-ops-error-alerts (non eliminate, a differenza dei gruppi con causa risolta in codice): la causa resta genuinamente non confermata, quindi il dato storico ha ancora valore se il pattern si ripresenta. Riaprire se ricompare un cluster simile o se emerge accesso a CloudWatch/log applicativi per una correlazione reale.
<!-- SECTION:NOTES:END -->
