---
id: TASK-166
title: >-
  Ri-misurare share rate, retention e volume sfide 2 settimane dopo TASK-149 e
  decidere se accelerare TASK-33/TASK-156
status: Backlog
assignee: []
created_date: '2026-08-05 15:51'
labels:
  - growth
  - analytics
  - decision
dependencies:
  - TASK-149
documentation:
  - backlog/docs/doc-2
  - ANALYTICS_GUIDE.md
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sei un growth analyst scettico verso i miglioramenti percepiti: non ti fidi di un numero finche' non lo confronti con una finestra temporale comparabile e un campione sufficiente, e non scambi rumore su n piccolo per un trend. Il 2026-08-05, da uno scan diretto delle tabelle DynamoDB prod (la dashboard admin non ha ancora questa vista nativa, vedi TASK-41), i gate di doc-2 misurati sugli ultimi 30 giorni erano: completamento test breve 74,9% (gate >=60%, superato), result-to-share 3,4% (gate >=15%, molto sotto), challenge open-to-complete circa 27% ma su soli 26 eventi/14 sfide totali (campione troppo piccolo per fidarsi). TASK-149 (riordino CTA Sfida un amico su Results, cosi' non e' piu' visivamente secondaria a Share) e' stato chiuso lo stesso giorno della misurazione, quindi la finestra dei 30 giorni copre quasi solo il prima del fix, non il dopo. Non lavorare su questo task prima del 2026-08-19 (14 giorni pieni dopo il deploy di TASK-149): prima di allora i dati sono contaminati dal periodo pre-fix. Quando arrivi a quella data, ricalcola share rate e challenge open-to-complete isolando la finestra post-deploy. Se TASK-41 e' stato completato nel frattempo usa la dashboard admin; altrimenti ripeti lo scan diretto documentato in ANALYTICS_GUIDE.md, con la stessa logica di normalizzazione di normalize_analytics_event in backend_fastapi.py (eventi legacy da actionType/timestamp, eventi prodotto da eventName/occurredAt, identita' unica = anonymousUserId o legacy-session:sessionId).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Share rate e challenge open-to-complete ricalcolati su una finestra di almeno 14 giorni pieni successiva al 2026-08-05 (deploy TASK-149), isolata dal traffico precedente
- [ ] #2 Se lo share rate resta sotto il 15%, TASK-33 e TASK-156 vengono portati a priorita' Alta (se non gia' Alta) e a stato To Do (se ancora Backlog), con notifica esplicita all'utente del cambio
- [ ] #3 Se lo share rate raggiunge o supera il 15%, il risultato viene registrato come voce ADR in decision-1 e non viene fatta alcuna escalation
- [ ] #4 Il volume totale di sfide create viene riportato accanto al tasso open-to-complete, etichettando il gate come dato insufficiente anziche' superato se il totale sfide e' sotto circa 30
<!-- AC:END -->
