---
id: TASK-202
title: Neutralizzare colori rosso e verde nelle scelte
status: To Do
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 08:05'
labels:
  - frontend
  - ux
  - accessibility
dependencies: []
priority: medium
type: enhancement
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Attualmente le due opzioni di risposta nei dilemmi usano lo stile btn-yes (rosso/sangue) e btn-no (verde pallido), e i grafici a torta usano rosso e verde. Nel contesto di dilemmi etici, l'accostamento rosso/verde veicola inconsciamente l'idea che un'opzione sia 'sbagliata/cattiva' e l'altra 'giusta/buona'. Un dilemma etico genuino non ha risposte giuste o sbagliate ma trade-off tra principi. Riprogettare i pulsanti di scelta e i grafici con palette neutre e simmetriche (es. Slate/Charcoal e Muted Bronze/Amber) coerenti col tema dark horror, senza gerarchia etica implicita.

Nota (ADR-044, TASK-102/107): quella modifica ha gia' toccato la stessa coppia di colori per un fix di contrasto WCAG AA (introducendo --text-danger-readable e schiarendo --creepy-pale-green/--creepy-sickly-green), scartando esplicitamente una redesign completa della palette come fuori scope per quel task. Questo task esegue ora quella redesign, ma DEVE preservare il contrasto >=4.5:1 gia' raggiunto su ogni sfondo scuro in uso, non regredirlo. Non toccare l'uso generico di --creepy-blood in UI non legate alla doppia scelta (CTA primarie, bottone elimina account, ecc.) - resta fuori scope.

La nuova palette va introdotta come variabili condivise (es. --choice-a / --choice-b) in shared.css e applicata OVUNQUE esista una doppia scelta etica, non solo elencando le 4 modalita': verificate oggi in EvaluationDilemmasScreen (bottoni btn-yes/btn-no + pie chart con fill #7a4a4a/#2a3a2a), PartyRoomScreen (bottoni + party-reveal-bar/party-reveal-first + testo voti party-reveal-choice.first/.second su --text-danger-readable/--creepy-pale-green), DailyMoralCrimeScreen (bottoni + daily-result-first/second su --creepy-rust/--creepy-sickly-green), ChallengeLandingScreen (bottoni risposta Duel, stessa classe btn-yes/btn-no).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nessun pulsante di scelta dilemma (Solo Evaluation, Party Room, Moral Duel, Daily Moral Crime) utilizza colori che suggeriscano polarita' etica (rosso vs verde)
- [ ] #2 Le due opzioni risultano visivamente distinte, paritetiche per importanza gerarchica e ad alto contrasto
- [ ] #3 I grafici a torta, le barre di reveal/risultato e il testo dei voti usano una palette neutra definita come variabili condivise, non valori hardcoded per-schermata
- [ ] #4 Il contrasto testo/sfondo >=4.5:1 ottenuto da ADR-044 non regredisce su nessuno sfondo scuro in uso
- [ ] #5 Modifica verificata su tutte le superfici di doppia scelta individuate: Solo Evaluation, Party Room (bottoni + reveal), Moral Duel (ChallengeLandingScreen), Daily Moral Crime
<!-- AC:END -->
