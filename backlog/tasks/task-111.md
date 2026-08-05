---
id: TASK-111
title: >-
  Fai un'analisi completa dal punto di vista della UX e salva nei Todo del
  backlog tutti i miglioramenti che si possono avere
status: Done
assignee: []
created_date: '2026-07-31 15:05'
updated_date: '2026-08-05 09:09'
labels: []
dependencies: []
priority: medium
ordinal: 23000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Analizzati i flussi principali (home, test, risultati, challenge/duel, party room, profilo pubblico, account, tutorial, about/legal) oltre ai temi cross-cutting (navigazione, stati di errore/loading, i18n readiness, accessibilita' non-contrasto)
- [x] #2 Ogni miglioramento reale trovato e non gia' tracciato e' stato salvato come task nel backlog con priorita' e motivazione
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Audit UX completo via subagent di ricerca, con verifica diretta a campione (5/5 confermati accurati) dei findings piu' gravi prima di creare i task, per evitare di fidarmi ciecamente del report. Escluso tutto cio' che risultava gia' tracciato (controllato l'intero backlog task list prima di iniziare): contrasto colori (102/107/124), AnalyticsAdminScreen (99/100/128), radar chart (105, appena corretto), reveal Challenge (110, appena implementato), account page (120), scheda archetipo+AI (121), footer privacy (122), Party Room game design (123), share card (133/134), QA matrix (71), dashboard analytics (4). Trovati 17 problemi nuovi, creati come TASK-143..161: 2 bug ALTA priorita' in To Do (TASK-143: un fallimento di /analyze-results butta via l'archetipo gia' calcolato deterministicamente e nasconde Challenge+share card, violando il vincolo doc-1/doc-2 sul funzionamento senza Groq; TASK-144: la schermata di crash e' hardcoded in italiano, viola il mandato EN-only di TASK-101), 5 bug/miglioramenti MEDIA priorita' in To Do (145 About Screen pubblicizza Story Mode inesistente, 146 progresso invitato Challenge perso al refresh, 147 AccountDeleteScreen vicolo cieco per anonimi, 148 nessun indicatore di riconnessione in Party Room, 149 riordino CTA risultati), 11 miglioramenti BASSA priorita' in Backlog (150-160: window.alert(), link non-SPA, landmark main, uscita da Party Room, gate tutorial party, doppio ingresso account, sharing frammentato, contesto profilo pubblico, share rematch, uscita da Challenge, i18n About), 1 decisione di prodotto in Open Points (TASK-161: se dare a Pass-the-Phone un ponte verso il loop di challenge o deprioritizzarlo, dato che oggi non contribuisce alla metrica North Star). Nessuna fix implementata in questo task (solo analisi e tracciamento, stesso pattern di TASK-112); TASK-143/144 meritano attenzione a breve data la gravita'.
<!-- SECTION:FINAL_SUMMARY:END -->
