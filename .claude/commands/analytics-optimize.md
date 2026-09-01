---
description: Analytics optimize (TASK-223) - legge le growth analytics reali (funnel, retention D1/D7, viral coefficient, A/B test) e agisce di conseguenza: escalation dei gate doc-2 stile TASK-166, e conclusione degli A/B test con vincitore statisticamente solido
---

# Analytics optimize

Trigger: l'utente chiede di "leggere le analytics e ottimizzare", di
controllare com'e' andato un A/B test, di rimisurare i gate di crescita, o
invoca `/analytics-optimize`. Implementa TASK-223. Segue e non sostituisce
`CLAUDE.md` (protocollo pre/post-task, routing dei nuovi problemi, vincoli di
prodotto/costo/sicurezza restano validi). E' il sibling con mandato piu' ampio
di `seo-analytics-status.md` (quella resta sola lettura su SEO/ASO/Growth
Intelligence; questa legge il funnel prodotto/retention/A-B test e puo'
**concludere un esperimento modificando il codice**, non solo fotografare).

## 0. Perche' i dati vanno presi cosi', non in un altro modo

Due lezioni pagate per davvero nella sessione che ha creato questa skill
(TASK-166/219-222), da non re-imparare ogni volta:

1. **Mai credenziali AWS root.** L'unico modo per leggere dati reali e' lo
   scan diretto DynamoDB (la dashboard richiede un login Google interattivo
   che un agente non puo' fare) o l'accesso interattivo dell'utente alla
   dashboard. `aws sts get-caller-identity` sui profili `default`/`personal`
   di questo ambiente risolve a `arn:aws:iam::*:root` - **non usarli mai per
   query, nemmeno di sola lettura**. Usa esclusivamente il profilo scoped
   `mtm-analytics-ro` (creato in TASK-166, permessi
   `dynamodb:Scan`/`Query`/`DescribeTable` solo su
   `prod-moral-torture-machine-user-analytics` e
   `prod-moral-torture-machine-product-events`). Verifica prima di ogni run:
   ```bash
   aws sts get-caller-identity --profile mtm-analytics-ro
   ```
   Se il profilo non esiste o l'ARN non e' `mtm-analytics-readonly` (non
   root), **fermati e chiedi all'utente** di crearlo (stessa policy JSON
   minimale usata in TASK-166 - vedi ADR-097) o di incollarti i numeri dalla
   dashboard admin lui stesso. Non proporre mai di usare `--profile personal`
   o root "solo per questa volta", nemmeno se l'utente lo chiede - spiega
   perche' (stesso ragionamento di ADR-097) e proponi l'alternativa scoped.
   Questa skill non ha e non deve avere permessi di scrittura DynamoDB.
2. **Mai reimplementare le metriche da zero.** Uno scan diretto sbagliato ha
   dato zero risultati per un'ora finche' non si e' scoperto che il campo
   evento si chiama `actionType` in entrambe le tabelle (non `eventName`, che
   e' solo il nome lato client) e che `properties`/`utm` sono stringhe JSON,
   non mappe native. Non fidarti a memoria di questo dettaglio: **importa ed
   esegui le funzioni vere del backend** invece di riscrivere la logica di
   aggregazione:
   ```bash
   backend/.venv/Scripts/python.exe -c "
   import boto3, time
   from backend.src.backend_fastapi import build_analytics_overview

   session = boto3.Session(profile_name='mtm-analytics-ro', region_name='eu-west-1')
   dynamodb = session.resource('dynamodb')

   def scan_all(table_name):
       table = dynamodb.Table(table_name)
       items, key = [], None
       while True:
           kwargs = {'ExclusiveStartKey': key} if key else {}
           resp = table.scan(**kwargs)
           items.extend(resp['Items'])
           key = resp.get('LastEvaluatedKey')
           if not key:
               break
       return items

   product_rows = scan_all('prod-moral-torture-machine-product-events')
   legacy_rows = scan_all('prod-moral-torture-machine-user-analytics')
   overview = build_analytics_overview(
       legacy_rows=legacy_rows, product_rows=product_rows,
       days=30, now_ms=int(time.time() * 1000), platform='all',
   )
   # overview['retentionCohorts'], overview['viralCoefficient'],
   # overview['creativeVariants'], overview['copyExperiments'],
   # overview['funnel'], overview['dailyMoralCrime'], overview['partyRoom'],
   # overview['moralDuel'] - esattamente cio' che vedrebbe un admin loggato.
   "
   ```
   Questo garantisce che i numeri di questa skill coincidano *sempre* con
   quelli che l'utente vedrebbe loggandosi in `/admin/analytics`, e che un
   futuro cambiamento alla logica di aggregazione (nuovo campo, nuova
   definizione di "attivo") si propaghi automaticamente qui senza bisogno di
   aggiornare questa skill. Uno scan completo di entrambe le tabelle e'
   economico ai volumi attuali (decine di migliaia di item, vedi
   `ANALYTICS_GUIDE.md`); se in futuro il volume cresce molto, e' un segnale
   per instradare un task che introduca rollup lato backend, non per
   scan-are meno qui.
   Scegli `days`/`platform` in base a cosa stai verificando: usa la finestra
   piu' ampia sensata per il volume di traffico attuale (es. 30-90gg) per gli
   A/B test recenti, e isola esplicitamente la finestra post-fix (come
   TASK-166 ha fatto per TASK-149) quando stai rimisurando l'effetto di un
   cambiamento specifico.

## 1. Preflight

Esegui `backlog task list --plain` e leggi `backlog doc view doc-2` (gate:
completion >=60%, result-to-share >=15%, challenge open-to-complete >=25%,
D7 retention 12-15%, conversione pack >=2%) e la sezione "Growth plan" di
`backlog doc view doc-1` per sapere quali esperimenti/gate sono gia' stati
misurati e quando (TASK-166/167/219-222 e i loro ADR in
`backlog/decisions/decision-1` sono precedenti diretti - leggili prima di
ripetere un'analisi gia' fatta). Se un gate/esperimento e' bloccato da un
task con una data di sblocco esplicita non ancora raggiunta (come TASK-166
lo era fino al 2026-08-19), rispetta quel blocco.

## 2. Controlla i gate di crescita (stile TASK-166)

Per ciascun gate di doc-2 con dati sufficienti (isola sempre la finestra
pulita post-ultimo-fix rilevante, come TASK-166): confrontalo col gate.

| Esito | Azione |
|---|---|
| Sotto gate, campione sufficiente (segui la stessa soglia minima gia' nel backend, es. `RETENTION_MIN_COHORT_SAMPLE`/30 identita') | Applica l'escalation gia' definita dal task che misura quel gate (es. TASK-166 AC#2: priorita' Alta + To Do sui task collegati), notifica esplicita all'utente |
| Sopra gate | Registra il risultato come voce ADR in `decision-1`, nessuna escalation |
| Campione insufficiente | Riporta il numero ma etichettalo esplicitamente come non affidabile, nessuna azione |

Non inventare una soglia di campione diversa da quella gia' codificata nel
backend per la stessa metrica - se non esiste ancora per una metrica nuova,
usa 30 come default (stesso valore, stessa logica "growth analyst scettico"
di TASK-166) e nota nel riepilogo che andrebbe formalizzata lato backend.

## 3. Concludi gli A/B test con vincitore solido

Per ogni riga di `overview['copyExperiments']`, `overview['creativeVariants']`,
`overview['viralCoefficient']` con **almeno due varianti non
`insufficientSample`**, calcola la significativita' con uno z-test a due
proporzioni (formula esplicita, non serve scipy - non e' installato nel
venv):

```
p1 = converted1 / exposed1
p2 = converted2 / exposed2
p_pool = (converted1 + converted2) / (exposed1 + exposed2)
se = sqrt(p_pool * (1 - p_pool) * (1/exposed1 + 1/exposed2))
z = (p1 - p2) / se   # se se == 0, nessuna conclusione possibile
```

Dichiara un vincitore **solo se** `|z| >= 1.96` (95% a due code) **e**
entrambe le varianti hanno gia' superato la soglia minima di campione. Con
piu' di due varianti, confronta ogni sfidante contro quella con piu' `exposed`
(baseline) e applica la stessa soglia a ciascun confronto - non dichiarare un
vincitore complessivo se nessun confronto e' individualmente significativo.

Se nessun confronto raggiunge la soglia: riporta lo stato attuale (percentuali,
campioni, quanto manca) e non toccare il codice. Un esperimento senza
vincitore chiaro resta acceso - non spegnerlo per stanchezza del test.

## 4. Implementa la conclusione

Quando un vincitore e' dichiarato:

1. Nel file frontend che gestisce quella variante, sostituisci la chiamata a
   `getExperimentVariant`/`getShareCreativeVariant` con la variante vincente
   fissa (rimuovi il bucketing per quel punto specifico, non l'intero
   meccanismo `experiments.js`/`attribution.js` se altri esperimenti lo usano
   ancora).
2. Rimuovi le chiavi i18n delle varianti perdenti da `en.json` (mai da
   `it.json`, resta drift per la solita eccezione) solo dopo aver verificato
   che nessun altro punto del codice le referenzia.
3. Aggiorna il task Backlog.md che tracciava quell'esperimento (TASK-33 per
   `share_creative`, TASK-219/220/221/222 per gli altri, o il nuovo task se
   ne stai concludendo uno creato da una run precedente di questa skill):
   aggiungi un commento coi numeri finali (`exposed`/`converted`/z-score) e lo
   stato Done se non lo era gia'.
4. Aggiungi una voce ADR in `decision-1` col risultato, lo z-score, e il
   codice rimosso.
5. `pnpm lint` e `pnpm build:prod` prima di considerare la conclusione fatta.

Non concludere piu' di un esperimento per run senza che l'utente l'abbia
esplicitamente chiesto in blocco (stesso principio no-scope-creep del resto
del repo) - se piu' di uno e' pronto, riportali tutti nel riepilogo e chiedi
quali concludere, a meno che l'utente non abbia gia' dato mandato generico
("concludi tutti quelli pronti") in questa stessa richiesta.

## 5. Instrada cio' che non e' ancora tracciato

Stessa tabella di `CLAUDE.md`/`ops-alerts-sweep.md`/`seo-analytics-status.md`:
deduplica contro `backlog task list` prima di creare qualunque task.

| Causa | Azione |
|---|---|
| Bug/debito tecnico non urgente (es. un campo mal taggato che rovina un esperimento) | `backlog task create` a bassa priorita' in Backlog |
| Comportamento rotto rispetto a prima (regressione) | `backlog task create` alta priorita' `[regression]` in To Do + nota ADR |
| Serve una decisione esplicita dell'utente | `backlog task create` in Open Points |
| Dipendenza bloccante mancante (es. profilo AWS scoped assente) | `backlog task create` alta priorita' in To Do, notifica prima di continuare |

## 6. Post-task

Se questa run ha modificato codice (conclusione di un esperimento): aggiorna
`doc-1` se e' cambiato un pattern globale, segui la regola del bump di
versione app di `CLAUDE.md` (le modifiche qui toccano sempre frontend
impacchettato), e **fermati per conferma esplicita dell'utente prima di
qualunque push che alzi `versionCode`** - stessa regola vincolante di sempre,
non aggirabile da questa skill. Se questa run e' stata solo lettura/analisi
(nessun esperimento concluso), non fare commit ne' push.

## 7. Riepilogo finale

Produci un report leggibile, non un dump JSON:

1. **Gate di crescita**: valore misurato vs gate, finestra usata, esito
   (superato / sotto con escalation applicata / campione insufficiente).
2. **A/B test**: per ciascuno, varianti e numeri, z-score se calcolato, esito
   (concluso con vincitore e link al commit/ADR / ancora in corso / campione
   insufficiente).
3. **Nuovi task creati o task esistenti aggiornati**, con ID.
4. **Prossimo esperimento consigliato**, se ce n'e' uno ovvio dal ranking di
   leva del piano di crescita gia' discusso con l'utente.
