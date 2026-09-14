---
id: TASK-306
title: >-
  Completion rate del test breve su Android e' circa la meta' di web (scoperto
  in analytics-optimize deep-dive, 2026-09-14)
status: To Do
assignee: []
created_date: '2026-09-14 08:12'
labels:
  - growth
  - analytics
  - android
  - regression-watch
dependencies: []
documentation:
  - backlog/docs/doc-2
priority: high
type: bug
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scan diretto (mtm-analytics-readonly + normalize_analytics_event, riuso codice esistente) su 30gg reali: test_started->test_completed = 44,9% su Android (44/98) contro 86,8% su web (534/615). z-test a due proporzioni: z=-9,84, differenza altamente significativa, non rumore campionario. Il gap non e' isolato a una versione app vecchia gia' corretta altrove: per appVersion, 1.6.4 (build piu' vecchia in traffico, 2297 eventi/30gg) = 49,2% (61 iniziati/30 completati) e 1.13.0 (build piu' recente distribuita, 743 eventi/30gg) = 38,5% (26/10) - persistente su piu' versioni, non un singolo regression puntuale. Anche lo step iniziale test_started->answered e' piu' debole su Android (78,6% vs 97,7% su web), quindi parte dell'abbandono avviene gia' nei primissimi secondi, non solo in profondita' nel flusso.

Sotto la soglia gate doc-2 'short-test completion >=60%' se isolato per piattaforma Android (oggi il gate e' verificato solo in aggregato su tutte le piattaforme nel pannello Growth gates, TASK-305, dove il volume web maggiore nasconde il problema Android).

Non e' un problema di strumentazione (TASK-7, gia' Done, ha verificato copertura/qualita' evento su entrambe le piattaforme separatamente) - i numeri qui usano lo stesso normalize_analytics_event gia' verificato. Causa non ancora nota: possibili piste da investigare - comportamento WebView/Capacitor su basso-end device, gestione ciclo di vita Activity (pausa/resume durante la sequenza di dilemmi), prefetch dei dilemmi piu' lento su rete mobile, o un problema UI (tap target, gesture) specifico della build Android. Nessuna fix proposta qui: serve prima riprodurre/isolare la causa su un device o log reale prima di intervenire alla cieca.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Causa dell'abbandono Android-specifico (test_started->answered e answered->test_completed) isolata riproducendo il flusso su un device/emulatore Android reale o analizzando log/crash reali, non solo dati aggregati
- [ ] #2 Il gap e' confermato o smentito su una finestra piu' ampia (60-90gg) per escludere un effetto stagionale/di traffico
- [ ] #3 Se confermato un bug reale, fix implementato e completion rate Android rimisurata post-fix per verificare il recupero verso il livello web
- [ ] #4 Pannello Growth gates (TASK-305) valuta se mostrare anche la scomposizione per piattaforma del gate short-test-completion, non solo l'aggregato, cosi' un futuro gap non resti nascosto dal volume web
<!-- AC:END -->
