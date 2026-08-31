---
id: TASK-166
title: >-
  Ri-misurare share rate, retention e volume sfide 2 settimane dopo TASK-149 e
  decidere se accelerare TASK-33/TASK-156
status: Done
assignee: []
created_date: '2026-08-05 15:51'
updated_date: '2026-08-31 15:21'
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
- [x] #1 Share rate e challenge open-to-complete ricalcolati su una finestra di almeno 14 giorni pieni successiva al 2026-08-05 (deploy TASK-149), isolata dal traffico precedente
- [x] #2 Se lo share rate resta sotto il 15%, TASK-33 e TASK-156 vengono portati a priorita' Alta (se non gia' Alta) e a stato To Do (se ancora Backlog), con notifica esplicita all'utente del cambio
- [ ] #3 Se lo share rate raggiunge o supera il 15%, il risultato viene registrato come voce ADR in decision-1 e non viene fatta alcuna escalation
- [x] #4 Il volume totale di sfide create viene riportato accanto al tasso open-to-complete, etichettando il gate come dato insufficiente anziche' superato se il totale sfide e' sotto circa 30
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-07: nella stessa sessione in cui e' stato letto questo task e' stato deployato anche TASK-172 (CTA 'Spread the Guilt' per-dilemma, altra leva sul result-to-share) e TASK-173 (rimozione Pass-the-Phone, cambia il traffico homepage). Rispettato il vincolo del task: nessuna ri-misurazione fatta oggi, resta bloccato fino al 2026-08-19. Quando si riprende, isolare l'effetto di TASK-149 da quello di TASK-172 (entrambi toccano share rate nella stessa finestra) invece di assumere un confronto pulito solo pre/post-149; se necessario, guardare l'evento dilemma_audience_share_clicked (TASK-172) separatamente da share_clicked (TASK-149) nel breakdown.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-31 15:16
---
RISULTATI (2026-08-31, finestra 2026-08-06/2026-08-31, 25.6gg pieni, isolata dal traffico pre-TASK-149 del 2026-08-05): share rate = 56 identita' con share_clicked / 472 identita' con result_viewed (union schema nuovo+legacy) = 11,86% (gate 15%, NON superato; era 3,4% il 2026-08-05 su finestra contaminata pre-fix - miglioramento reale ma insufficiente). Challenge open-to-complete = 24/82 = 29,27% (gate 25%, SUPERATO), con 65 eventi challenge_share_ready totali nella finestra: campione sufficiente (>=~30), quindi il gate e' etichettabile come superato, non come dato insufficiente. AC#2 applicato: TASK-33 e TASK-156 portati ad Alta priorita' (TASK-156 anche a To Do). Misurato via scan DynamoDB read-only diretto (profilo IAM scoped mtm-analytics-readonly, non root - creato per questa misurazione) sulle tabelle prod-moral-torture-machine-product-events e prod-moral-torture-machine-user-analytics, stessa logica di identita' di normalize_analytics_event.
---

created: 2026-08-31 15:21
---
Nota metodologica (stesso giorno, seguendo l'avviso 2026-08-07 sopra): la scelta di numeratore/denominatore fa differenza. Con denominatore result_viewed limitato al solo schema prodotto (392, esclude i 860 eventi legacy results_analyzed nella stessa finestra - la tabella legacy riceve ancora scritture fresche, verificato, possibile ulteriore finding da approfondire) lo strict share_clicked-only sale a 14,29% (comunque sotto il gate 15%). Includendo anche dilemma_audience_share_clicked (TASK-172, share per-dilemma DURANTE il test, non dopo il risultato) e share_card_downloaded, il tasso allargato sale al 35,46% - ma concettualmente non e' un 'result-to-share rate' perche' l'azione TASK-172 puo' avvenire prima che un risultato esista. La definizione stretta (share_clicked, azione post-risultato) resta la piu' corretta per il gate di doc-2 ed e' sotto il 15% in ogni variante testata (11,86%-14,29%): l'escalation di TASK-33/TASK-156 gia' applicata resta valida indipendentemente da questa sensibilita'.
---
<!-- COMMENTS:END -->
