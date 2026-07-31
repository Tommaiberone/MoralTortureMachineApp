---
id: TASK-102
title: 'Aumentare il contrasto del testo, in particolare rosso e verde'
status: To Do
assignee: []
created_date: '2026-07-31 13:21'
labels:
  - frontend
  - accessibility
  - design
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il tema horror dichiara esplicitamente 'Low contrast, hard to read, unsettling' come scelta di design (frontend/src/styles/horrorTheme.css riga 22), ma alcuni testi reali risultano troppo poco leggibili. Misurato (rapporto WCAG): --text-danger/--horror-crimson (#7a4a4a) usato come COLORE DI TESTO (non solo bordo) in ResultsScreen.css (.results-archetype-title, .results-ai-title, verdict title), SeoLandingScreen.css e StoryModeScreen.css ha un contrasto reale di 2.1-2.6:1 contro i background scuri usati (#1a1a1a/#121212/#242424) - sotto la soglia WCAG AA sia per testo normale (4.5:1) sia per testo grande/bold (3:1). I verdi (--creepy-sickly-green #1a2a1a, --creepy-pale-green #2a3a2a, contrasto 1.0-1.5:1) sono oggi usati solo come border-color (es. .btn-no), non come testo, quindi meno urgenti ma comunque poco visibili come confine UI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni colore usato come color (testo) su sfondo scuro raggiunge almeno 4.5:1 (o 3:1 per testo grande/bold >=18px bold), verificato con rapporto di contrasto WCAG, non solo a occhio
- [ ] #2 --text-danger/--horror-crimson e i suoi usi (titoli risultati, archetipo, story mode) sono leggibili senza perdere l'identita' 'rosso pericolo' del tema
- [ ] #3 I bordi verdi/rossi usati come elementi UI (bottoni si/no, badge) restano riconoscibili come coppia distinta di colori, non necessariamente a 4.5:1 (non sono testo)
- [ ] #4 Il resto dell'estetica horror (bassa saturazione, tono cupo) non viene stravolto: si sistemano i valori dei colori esistenti, non si ridisegna il tema
<!-- AC:END -->
