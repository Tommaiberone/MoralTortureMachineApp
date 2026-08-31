---
id: TASK-202
title: Neutralizzare colori rosso e verde nelle scelte
status: Done
assignee: []
created_date: '2026-08-31 07:49'
updated_date: '2026-08-31 09:37'
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
- [x] #1 Nessun pulsante di scelta dilemma (Solo Evaluation, Party Room, Moral Duel, Daily Moral Crime) utilizza colori che suggeriscano polarita' etica (rosso vs verde)
- [x] #2 Le due opzioni risultano visivamente distinte, paritetiche per importanza gerarchica e ad alto contrasto
- [x] #3 I grafici a torta, le barre di reveal/risultato e il testo dei voti usano una palette neutra definita come variabili condivise, non valori hardcoded per-schermata
- [x] #4 Il contrasto testo/sfondo >=4.5:1 ottenuto da ADR-044 non regredisce su nessuno sfondo scuro in uso
- [x] #5 Modifica verificata su tutte le superfici di doppia scelta individuate: Solo Evaluation, Party Room (bottoni + reveal), Moral Duel (ChallengeLandingScreen), Daily Moral Crime
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Introdotte 6 nuove variabili neutre in horrorTheme.css (--choice-a/-border/-text slate blue-gray #2f3f4f/#5a7285/#a8bdd0, --choice-b/-border/-text bronze/amber #4a3a26/#8a6f45/#d4b483), calcolate a mano (formula WCAG) per contrasto testo >=4.5:1 su tutti e 3 gli sfondi scuri in uso (~7.9-9.7:1 misurato), preservando/estendendo la tecnica di ADR-044 invece di regredirla. Applicate su tutte le superfici di doppia scelta verificate nel codice: .btn-yes/.btn-no in shared.css (usate identiche da Solo Evaluation, Party Room, Daily Moral Crime e Moral Duel/ChallengeLandingScreen - un solo fix propaga a tutte e 4 le modalita'), pie chart di EvaluationDilemmasScreen.jsx (colori hardcoded #7a4a4a/#2a3a2a sostituiti con var(--choice-a/b), stesso pattern var() gia' usato da TASK-124 in renderPieLabel), barra e testo voti di reveal in PartyRoomScreen.css (party-reveal-first, party-reveal-choice.first/.second), barre risultato di DailyMoralCrimeScreen.css (daily-result-first/second). AC2 (parita' gerarchica): risolta anche un'asimmetria preesistente non menzionata nella descrizione originale - .btn-yes aveva un riempimento pieno rosso mentre .btn-no era un bottone charcoal neutro con solo un bordo verde sottile, quindi visivamente il primo pesava piu' del secondo; ora entrambi hanno riempimento pieno con luminanza quasi identica (L=0.047 vs 0.046) per peso visivo davvero paritetico. Lasciati intenzionalmente intoccati gli usi di rosso/verde non legati alla polarita' delle due opzioni (fuori scope, come gia' notato nel task e coerente con ADR-044): messaggi di errore reali (--text-danger-readable su party-home-error, party-connection-banner, daily-inline-error, ChallengeCompareScreen), badge 'is-caller'/'il piu' diviso finora' (non confrontano le due opzioni), bottoni 'next/continua' con bordo verde convenzionale (challenge-next-button, evaluation-generate-new-button), progress-dot.active/.completed (indicatore di stato del progresso, non delle due risposte), e l'uso generico di --creepy-blood in .btn-primary/CTA. pnpm lint pulito, pnpm build:prod pulito (810 moduli, nessun errore).

Version bump (per CLAUDE.md mandatory-bump rule, packaged web code changed): frontend/package.json and Android versionName 1.7.0 -> 1.7.1, versionCode 20 -> 21. Per the user's explicit 2026-08-31 decision, each of TASK-201-205 gets its own version bump and Play Store publish rather than batching them.
<!-- SECTION:FINAL_SUMMARY:END -->
