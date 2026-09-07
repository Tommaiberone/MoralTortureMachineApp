---
id: TASK-273
title: >-
  Diagnosticare la causa della D7 retention quasi nulla (0,3%): limite
  strutturale del prodotto o leva mancante?
status: Backlog
assignee: []
created_date: '2026-09-07 08:18'
updated_date: '2026-09-07 08:29'
labels:
  - growth
  - analytics
  - retention
dependencies: []
references:
  - backlog/decisions/decision-1 - ADR-Log.md#adr-121
documentation:
  - backlog/docs/doc-2
priority: high
type: spike
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
La D7 retention complessiva e' 0,3% (letta 2026-09-07, ADR-121), sostanzialmente ferma da settimane nonostante Daily Moral Crime sia stato lanciato apposta per questo (TASK-167, D7 1,4% il 2026-08-10). E' il singolo numero che oggi blocca TASK-58 (subscription) e TASK-83 (paid acquisition), entrambi Open Points.

Segmentazione rapida per modalita' di primo contatto (finestra 60gg, stesso normalize_analytics_event/build_retention_cohorts del backend riusati, nessuna metrica reinventata): il 91% delle identita' (1633/1800) entra da Solo Evaluation e la sua D7 e' 0,1% (1482 idonee, 2 ritornate) - quasi indistinguibile da zero. Chi entra da Party Room (59 identita', campione sopra la soglia minima di 30 per il checkpoint D7) ha D7 = 5,1%. Chi entra da un Moral Duel (105 identita') ha D1 alto - 11,4%, contro il 2,7% di Solo - ma crolla a D7 = 0,0% (0 su 93 idonee). Daily Moral Crime come primo touchpoint e' quasi inesistente (3 identita' in 60 giorni): oggi non e' affatto un canale di ingresso, solo una destinazione per chi e' gia' dentro.

Questo e' un primo segnale, non una diagnosi: il differenziale (0,1% Solo vs 5,1% Party) suggerisce che il problema non e' puramente intrinseco al prodotto ('e' solo un quiz, la gente lo fa una volta') - le superfici sociali/sincrone gia' oggi trattengono di piu', anche se il campione resta piccolo. Ma il 91% del traffico entra dalla superficie che retiene peggio, e Duel mostra un pull-back rapido (D1) che si esaurisce prima di arrivare a sette giorni, il che punta a un loop asincrono troppo corto piuttosto che a un limite di categoria assoluto.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ripetere la segmentazione per modalita' di primo contatto su una finestra piu' ampia (60-90gg, quando il campione lo consente) e verificare se il differenziale Solo vs Party/Duel regge o e' rumore su campioni ancora piccoli (39 e 93 identita' nei checkpoint D7 di questa prima lettura)
- [ ] #2 Per la coorte Duel (D1 alto, D7 a zero): capire cosa succede tra il giorno 1 e il giorno 7 - il loop si esaurisce perche' il confronto e' stato gia' visto una volta (challenge_compared) o perche' l'app non da' alcuna ragione per riaprire dopo
- [ ] #3 Confrontare con benchmark noti di categoria (quiz/personality-test app) per stabilire quanta parte della D7 bassa sia normale per la categoria vs specifica di questo prodotto
- [ ] #4 Elencare le leve di retention oggi assenti nel prodotto (notifiche push - TASK-45 gia' in Backlog, reminder, nuovi contenuti ricorrenti, loop sociale asincrono 'qualcuno ti aspetta') con una stima qualitativa di sforzo e leva attesa per ciascuna
- [ ] #5 Raccomandazione esplicita finale non lasciata aperta: (a) investire in uno o piu' esperimenti mirati di retention con una leva specifica indicata, oppure (b) trattare il prodotto come strutturalmente orientato alla viralita' one-shot piu' che alla retention ricorrente e adattare la strategia di doc-2 di conseguenza
- [ ] #6 Se la raccomandazione e' (a): task di follow-up creati in To Do/Backlog secondo le regole standard di CLAUDE.md. Se e' (b): doc-2 aggiornato per riflettere esplicitamente la scelta, con voce ADR in decision-1
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-07: messo in standby su richiesta esplicita dell'utente. Invece di completare la diagnosi (benchmark di categoria, conferma campione, elenco leve) prima di decidere, l'utente ha scelto di procedere direttamente sulla leva gia' piu' evidente dal primo taglio dati (Duel D1 11,4%/D7 0%): TASK-274/275/45 partono ora per costruire le notifiche push. Questa card resta utile per dopo: quando le push saranno misurabili, riprenderla per (a) verificare se hanno davvero spostato la D7 complessiva, e (b) le AC ancora aperte (benchmark di categoria, differenziale Solo/Party/Duel su campione piu' ampio) restano un controllo di solidita' indipendente dal fatto che si sia gia' agito su una leva.
<!-- SECTION:NOTES:END -->
