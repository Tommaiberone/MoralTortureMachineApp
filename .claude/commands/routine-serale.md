---
description: Routine serale (TASK-108) - macina più task To Do possibile in autonomia, poi deploya e manda un recap via email SNS
---

# Routine serale

Trigger: l'utente dice "Vai con la routine serale" (o equivalente) oppure invoca
`/routine-serale`. Questo comando implementa TASK-108: partire e lavorare più
task "To Do" possibile senza chiedere conferma, lasciando non completati solo
quelli per cui serve un intervento umano, poi deployare e mandare un'email di
recap via SNS.

Questo file descrive il protocollo da seguire ogni volta che la routine viene
invocata. Segue e non sostituisce `CLAUDE.md` (protocollo pre/post-task,
routing dei nuovi task, vincoli di prodotto/costo/sicurezza restano validi).

## 1. Preflight (una sola volta per esecuzione)

1. Rileggi `backlog/docs/doc-1` e `backlog/decisions/decision-1`.
2. Esegui `backlog task list` e `backlog board` per avere lo stato corrente.
3. Costruisci la coda di lavoro dalla colonna **To Do**, ordinata per priorità
   (High, poi Medium, poi Low) e a parità di priorità per `ordinal`. Salta le
   colonne `Open Points` e `Blocked` (già segnalate come bloccate da qualcosa
   di esterno o da una decisione umana) e i task con una `dependencies:` non
   ancora `Done`.
4. Se trovi più task che descrivono lo stesso problema (es. duplicati creati
   in sessioni diverse), trattali come un solo lavoro: implementa una volta,
   marca entrambi come Done, nota la duplicazione nell'ADR.

## 2. Triage: autonomo vs serve l'utente

Per ogni task in coda, decidi PRIMA di iniziare a implementare:

**Serve l'intervento umano — lascialo com'è e passa oltre, annotandolo nel
recap finale** quando il task richiede almeno una di queste cose:
- verifica/QA reale su dispositivo, browser o account esterno che non puoi
  eseguire tu (es. test multi-device, E2E su Android WebView reale);
- revisione o approvazione legale/contenutistica non deterministica (es. testo
  di Privacy Policy/Terms, claim su dati sensibili);
- una decisione di prodotto o di business realmente aperta, senza criteri di
  accettazione che la rendano già oggettiva (es. analisi strategiche ampie tipo
  TASK-109/TASK-111 salvo indicazione esplicita diversa dell'utente);
- credenziali, account esterni, o un nuovo servizio/costo variabile che
  richiede l'eccezione esplicita del Free Tier (`CLAUDE.md`);
- qualunque azione irreversibile di produzione **oltre** al deploy+email di
  fine routine descritti sotto (es. cancellazioni di dati, rotazione
  credenziali, modifiche IAM ampie).

**Autonomo — implementalo senza chiedere conferma** in tutti gli altri casi:
modifiche di codice, test, contenuti/documentazione, CSS/UX quando gli
acceptance criteria già definiscono un target verificabile, wiring backend che
riusa infrastruttura già esistente (tabelle, topic SNS, guardie di abuso
esistenti), audit/analisi che producono solo nuovi task in backlog senza
toccare codice o produzione.

Se un'esecuzione della routine è stata avviata con uno scope più stretto
concordato con l'utente (es. "solo task sicuri", "tutto tranne deploy"),
quello scope prevale su questa sezione per quella sessione.

## 3. Esecuzione per-task

Per ogni task autonomo, segui il protocollo pre/post-task di `CLAUDE.md`:
`backlog task edit TASK-N --status "In Progress"` (più task possono essere In
Progress insieme, ADR-015) → implementa → esegui i controlli più mirati
possibili per l'area toccata (unit test, `python3 -m py_compile`, `pnpm lint`)
→ verifica gli acceptance criteria → `backlog task edit TASK-N --status "Done"`
→ aggiorna `backlog/docs/doc-1` se è cambiata architettura/moduli/dipendenze →
aggiungi una voce ADR concisa in `backlog/decisions/decision-1` per ogni
scelta tecnica o di prodotto non banale.

Non sacrificare qualità o test pur di segnare più task come fatti: è
preferibile completare meno task ma correttamente, e lasciare il resto in coda
per la prossima esecuzione della routine.

## 4. Nuovi problemi trovati durante il lavoro

Applica le regole di routing di `CLAUDE.md` (bug/debito → `Backlog` a bassa
priorità; dipendenza bloccante mancante → `To Do` alta priorità; regressione →
`[regression]` To Do alta priorità + nota ADR; decisione esterna → `Open
Points`), poi continua con il prossimo task della coda invece di fermarti.

## 5. Verifica finale

Dopo aver esaurito la coda raggiungibile: esegui la suite di test backend
rilevante, `pnpm lint` e `pnpm build:prod` sul frontend se sono stati toccati
file frontend, e rileggi `doc-1`/`decision-1` se sono stati toccati più di tre
file o completati più di tre task (regola già in `CLAUDE.md`).

## 6. Deploy e recap — SEMPRE con conferma esplicita finale

Il deploy e l'invio email sono l'unica parte della routine che richiede una
conferma esplicita dell'utente in questa stessa conversazione, anche quando il
resto della routine gira senza fermarsi: è l'unica azione con effetto reale e
difficilmente reversibile su produzione e utenti veri (`CLAUDE.md` vieta di
default deploy/push senza richiesta esplicita).

1. Prepara un commit (o più commit logici) con tutto il lavoro completato in
   questa esecuzione.
2. Controlla se il diff include un bump di `versionCode` in
   `frontend/android/app/build.gradle`. Se sì: **fermati e avvisa
   esplicitamente l'utente prima di eseguire il push**, perché per ADR-017 un
   push su `main` che alza `versionCode` pubblica automaticamente l'AAB sul
   track `production` di Google Play, senza alcuna revisione umana. Questo
   vale anche durante la routine autonoma.
3. Se non c'è bump di `versionCode`, un push su `main` è sufficiente perché la
   pipeline esistente (`.github/workflows/deploy.yml`) applichi Terraform e
   deployi backend/frontend. Non eseguire `terraform apply` localmente.
4. Solo dopo l'ok esplicito dell'utente per il push/deploy: pusha, poi manda
   il recap con:
   `aws --profile personal sns publish --topic-arn <arn di aws_sns_topic.ops_alerts, da backend/terraform/observability.tf> --subject "Routine serale - <data>" --message "<recap>"`
   Riusa il topic SNS operativo già esistente (già iscritto all'email
   dell'owner): non creare un nuovo topic, una nuova subscription o un nuovo
   servizio di invio email.
5. Il recap deve elencare: task completati (uno per riga, con cosa è
   cambiato), task lasciati in coda perché richiedono l'utente (con il
   motivo), eventuali nuovi task creati durante il lavoro.

## Nota

Questa routine non introduce nuovi servizi AWS, nuove tabelle a pagamento, né
bypassa gli avvisi obbligatori di `CLAUDE.md` (bump versione Android, warning
di rebuild Android, eccezione Free Tier): li applica task per task, non li
sostituisce.
