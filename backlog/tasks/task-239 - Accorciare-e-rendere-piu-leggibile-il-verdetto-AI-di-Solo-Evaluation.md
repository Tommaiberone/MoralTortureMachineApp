---
id: TASK-239
title: Accorciare e rendere piu' leggibile il verdetto AI di Solo Evaluation
status: Done
assignee: []
created_date: '2026-09-04 12:17'
updated_date: '2026-09-04 12:26'
labels:
  - backend
  - frontend
  - ai
  - results
dependencies: []
priority: high
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il testo AI generato da POST /analyze-results (backend_fastapi.py, prompt EN/IT) e' vincolato a un massimo di 170 parole e viene renderizzato come un unico blocco di testo denso (.results-ai-text in ResultsScreen.jsx/.css), senza interruzioni di paragrafo. L'utente lo giudica un 'wall of text poco leggibile' nella modalita' Solo Evaluation ('test your morality'). Ridurre il limite di parole del prompt (EN/IT) a un valore piu' breve e incisivo, mantenendo il vincolo esistente di riferirsi alle scelte specifiche fatte e di restare coerente con l'archetipo gia' assegnato (TASK-121). Migliorare anche la presentazione: line-height/spaziatura piu' ariosi, larghezza massima di lettura (measure) piu' stretta invece del blocco a piena larghezza della card.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Il vincolo di lunghezza nel prompt (EN e IT) e' ridotto rispetto alle attuali 170 parole, restando comunque un numero esplicito nel prompt
- [x] #2 .results-ai-text ha line-height e measure (larghezza massima di lettura) piu' leggibili invece del blocco a piena larghezza attuale
- [x] #3 Test backend esistenti (se presenti sul prompt) restano verdi; pnpm lint e pnpm build:prod passano; nessun controllo browser live, verificato via code review
- [x] #4 La coerenza con l'archetipo gia' assegnato (non deve contraddirlo ne' ripeterne la descrizione parola per parola, TASK-121) resta invariata; il prompt continua a basarsi sulle scelte specifiche del singolo utente (comportamento gia' corretto qui, a differenza del vincolo TASK-39 per Party/Duel che non si applica a questo endpoint mono-utente)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
backend_fastapi.py /analyze-results: reduced the word cap from 170 to 90 (both EN/IT prompts) and added an explicit instruction to write two short paragraphs separated by a blank line instead of one dense block. Frontend: ResultsScreen.css's .results-ai-text now uses white-space:pre-line so that blank-line paragraph break actually renders as a visual gap (a raw string with \n\n inside a plain <p> would otherwise collapse to one block regardless of the prompt change - the AI-text content alone wasn't the whole fix). Removed letter-spacing/word-spacing overrides that were tuned for the old monospace font and now just look loose on a proportional one; added max-width:48ch (centered) to cap the reading measure to a comfortable line length instead of stretching the full ~600px card width; line-height bumped 1.7->1.75. Corrected a mistake caught while closing this out: my own AC4 as originally drafted claimed a 'never raw per-dilemma answers' constraint that doesn't actually apply here - that's TASK-39's rule for the social Party/Duel verdicts; /analyze-results has always intentionally sent the user's own dilemmasWithChoices to ground the analysis in their real choices (TASK-121), and that's correct, not a bug - reworded the AC instead of 'fixing' something that wasn't broken. Backend full suite 198/198 (unaffected - no test asserts on prompt wording/word count); pnpm lint and pnpm build:prod pass; no live browser check performed (no-Playwright rule) - verified via code review only.
<!-- SECTION:NOTES:END -->
