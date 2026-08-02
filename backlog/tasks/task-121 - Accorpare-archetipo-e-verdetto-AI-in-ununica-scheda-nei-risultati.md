---
id: TASK-121
title: Accorpare archetipo e verdetto AI in un'unica scheda nei risultati
status: Done
assignee: []
created_date: '2026-08-02 08:22'
updated_date: '2026-08-02 08:24'
labels:
  - frontend
  - backend
  - ai
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Richiesta esplicita dell'utente: unire la scheda archetipo e la scheda 'verdetto della macchina' in ResultsScreen in una sola scheda, con il nome dell'archetipo come titolo e la descrizione generata dal modello AI subito sotto. Il prompt di /analyze-results deve ricevere anche nome e descrizione dell'archetipo gia' assegnato dal motore deterministico, in aggiunta a quanto gia' passato (punteggi medi e dilemmi/scelte), cosi' il testo generato risulta coerente con l'archetipo invece di essere un'analisi scollegata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il prompt inviato a Groq in /analyze-results include nome e descrizione dell'archetipo, oltre ai dati gia' passati
- [x] #2 ResultsScreen mostra una sola scheda: nome archetipo come titolo, testo generato dall'AI subito sotto
- [x] #3 Il flusso funziona anche quando Groq non e' disponibile (fallback deterministico dell'archetipo non cambia)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Backend: prompt_content di /analyze-results (entrambi i rami IT/EN) ora include nome+descrizione dell'archetipo gia' assegnato dal motore deterministico, con un'istruzione esplicita al modello di scrivere un testo coerente con quell'archetipo (non contraddirlo, non ripeterne la descrizione parola per parola) dato che verra' mostrato come descrizione sotto il suo nome. Frontend: ResultsScreen.jsx unisce le due schede precedenti (archetipo + verdetto) in una sola .results-archetype: <h2> col nome archetipo come titolo, testo AI (o spinner di caricamento) subito sotto, punti di forza/cieco sotto ancora. La scheda resta visibile anche se l'intera chiamata a /analyze-results fallisce (nessun archetipo disponibile): mostra comunque il testo di fallback esistente (results.analysis_error/rate_limit_error) invece di sparire, preservando il comportamento 'funziona anche senza Groq'. Rimossi i due titoli separati (results.archetype_title, results.verdict, ora inutilizzati) da en.json/it.json e le regole CSS orfane (.results-ai-analysis, .results-ai-title, .results-archetype-title/-description). pnpm lint, build:prod e l'intera suite backend (84 test) restano puliti.
<!-- SECTION:FINAL_SUMMARY:END -->
