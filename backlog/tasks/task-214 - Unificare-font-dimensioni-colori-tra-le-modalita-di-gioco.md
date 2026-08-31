---
id: TASK-214
title: Unificare font/dimensioni/colori tra le modalita di gioco
status: Done
assignee: []
created_date: '2026-08-31 13:17'
updated_date: '2026-08-31 13:21'
labels: []
dependencies: []
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit di Solo Evaluation, Party Room, Moral Duel e Daily Moral Crime ha trovato divergenze reali di font/dimensioni/colori tra le CSS delle modalita di gioco: (1) DailyMoralCrimeScreen.css e' l'unica a usare rem (root font-size non standard 21px) mentre le altre tre usano px; (2) .daily-kicker/.daily-choice-label/.daily-inline-error usano var(--text-danger) come colore di testo, lo stesso bug di contrasto <3:1 gia' corretto altrove da TASK-102/107/044 con --text-danger-readable; (3) il testo del dilemma e' mostrato dentro .text-box-default in Evaluation/Duel/Party ma come testo semplice piu' grande in Daily; (4) .evaluation-tease-text/.challenge-tease-text/.party-reveal-tease sono blocchi CSS quasi identici duplicati in tre file invece di una classe condivisa, e solo Evaluation ha il breakpoint mobile; (5) i pulsanti Si/No mostrano testo libero (firstAnswer/secondAnswer) in maiuscolo in Evaluation/Duel/Party ma .daily-choice forza text-transform:none, rompendo la coerenza visiva senza motivo legato al contenuto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Aggiunta una classe .tease-text condivisa in shared.css (con relativo breakpoint mobile) che sostituisce i tre blocchi duplicati in EvaluationDilemmasScreen.css/ChallengeLandingScreen.css/PartyRoomScreen.css e viene riusata anche da DailyMoralCrimeScreen per il testo di riflessione post-voto
- [x] #2 .daily-kicker/.daily-choice-label/.daily-inline-error usano var(--text-danger-readable) invece di var(--text-danger) per il testo
- [x] #3 Il testo del dilemma in DailyMoralCrimeScreen usa .text-box-default come le altre tre modalita
- [x] #4 DailyMoralCrimeScreen.css non usa piu' unita rem per allinearsi alla convenzione px delle altre schermate di gioco, mantenendo le stesse dimensioni visive (conversione 1:1 su root-font-size 21px)
- [x] #5 .daily-results .screen-title non forza piu' una font-size diversa dal valore condiviso usato da Party Room per un titolo di sezione analogo
- [x] #6 .daily-choice non forza piu' text-transform:none, cosi' le risposte libere sono maiuscole come nelle altre tre modalita
- [x] #7 pnpm lint e pnpm build:prod passano senza nuovi errori
<!-- AC:END -->
