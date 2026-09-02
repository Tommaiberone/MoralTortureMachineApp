---
description: Ops alerts sweep (TASK-130) - scansiona la tabella DynamoDB ops_error_alerts, raggruppa e studia ogni causa, elimina solo quelle chiare/non azionabili
---

# Ops alerts sweep

Trigger: l'utente invoca `/ops-alerts-sweep` (o chiede equivalentemente di
"controllare/ripulire gli alert di errore"). Implementa TASK-130: ogni 4xx/5xx
che l'API email tramite SNS (TASK-104/ADR-045) scrive anche un item nella
tabella DynamoDB `ops_error_alerts` (TASK-129/ADR-059,
`backend/terraform/main.tf`). Questo comando fa una sweep di quella tabella:
raggruppa, studia la causa nel codice, ed elimina dalla tabella solo i gruppi
la cui causa e' chiara e non richiede alcun intervento. Segue e non sostituisce
`CLAUDE.md` (protocollo pre/post-task, routing dei nuovi problemi, vincoli di
prodotto/costo/sicurezza restano validi).

## 1. Leggi la tabella

Nome tabella: `prod-moral-torture-machine-ops-error-alerts` (verifica sempre
con `terraform output` o leggendo `aws_dynamodb_table.ops_error_alerts.name`
in `backend/terraform/main.tf` se il naming e' cambiato). Usa il profilo AWS
CLI scoped `mtm-ops-alerts-writer` (TASK-224, 2026-09-02) - non `personal`,
che e' una credenziale root e CLAUDE.md ne vieta l'uso per automazione di
routine. Il profilo ha solo `dynamodb:Scan/DeleteItem/DescribeTable` su
questa tabella e `sns:Publish` sul topic ops_alerts (vedi routine-serale.md),
nient'altro:

```bash
aws --profile mtm-ops-alerts-writer dynamodb scan \
  --table-name prod-moral-torture-machine-ops-error-alerts \
  --output json
```

Se la tabella e' vuota, riporta "nessun alert da analizzare" e fermati: non
c'e' altro da fare.

## 2. Raggruppa, non riga per riga

Raggruppa gli item per `(statusCode, pathSignature)`. `pathSignature` e' gia'
normalizzato (route template per gli endpoint con path matchati, es.
`/party-rooms/{room_code}`, oppure `rate_limit:<rule_name>` per i 429 del
burst guard, oppure il path letterale per route non mappate - vedi ADR-059):
non serve raggruppare ulteriormente per somiglianza testuale del path. Per
ogni gruppo nota: quante occorrenze, l'intervallo temporale (`occurredAt`
min/max), un paio di `detail`/`path` di esempio.

## 3. Studia la causa di ogni gruppo

Per ogni gruppo, usa il codice del repository per capire *perche'* succede,
non solo *cosa* succede - stessa logica gia' applicata manualmente per le due
mail reali che hanno originato TASK-129/131 (vedi ADR-059/060 in
`backlog/decisions/decision-1` per due esempi concreti gia' risolti: 404 su
`/robots.txt` = rumore di bot sul dominio API, gia' fixato; 429 su
`rate_limit:party_room_poll` = possibile falso positivo da partecipanti sulla
stessa rete, vedi TASK-132, ancora aperto). Cerca:

- l'endpoint/middleware coinvolto (`backend/src/backend_fastapi.py`) e se
  quello status code e' un esito di business logic atteso (es. 409 su un
  join/submit gia' avvenuto, 404 su una risorsa scaduta/non trovata, 401/403
  su un token non valido) oppure un bug reale;
- se la causa e' gia' stata risolta da un commit/task successivo alla
  occorrenza piu' recente nel gruppo (controlla `git log`/Backlog.md);
- se e' rumore esterno non azionabile (scanner/bot su path statici tipo
  `/robots.txt`, `/.env`, `/wp-admin`, ecc. - path che non fanno parte
  dell'app);
- se e' invece un pattern che indica un problema reale lato client o backend
  (crescita nel tempo, molte occorrenze ravvicinate, status 5xx, o un path che
  fa parte del prodotto e non dovrebbe fallire cosi' spesso).

## 4. Decidi: elimina o lascia

**Elimina dalla tabella (in blocco, tutto il gruppo)** solo quando la causa e'
chiara E non richiede alcuna azione:
- e' un esito di business logic gia' atteso e documentato (es. i 409 "gia'
  fatto" del Duel, gia' discussi in ADR-045 come normali);
- e' rumore esterno innocuo (bot/scanner su path che non appartengono
  all'app);
- la causa root e' gia' stata risolta nel codice (verificabile leggendo il
  commit/task che l'ha chiusa) e non ci sono occorrenze successive al fix.

Per ogni gruppo eliminato usa `aws dynamodb delete-item` sulla singola
`alertId` di ogni item del gruppo (niente `BatchWriteItem` necessario ai
volumi attesi):

```bash
aws --profile mtm-ops-alerts-writer dynamodb delete-item \
  --table-name prod-moral-torture-machine-ops-error-alerts \
  --key '{"alertId": {"S": "<alertId>"}}'
```

**Lascia in tabella (non toccare le righe)** in tutti gli altri casi:
ambiguita', pattern che sembra un bug reale, causa non identificabile con
sicurezza dal solo codice, o qualunque caso che richiederebbe un cambiamento
di prodotto/infrastruttura/codice per essere risolto. Non modificare mai
codice, infrastruttura o configurazione da questo comando: questa skill legge
il codice solo per capire, mai per intervenire.

Per ogni gruppo lasciato che indica un problema reale, applica le regole di
routing di `CLAUDE.md` invece di limitarti a segnalarlo a voce:

| Causa | Azione |
|---|---|
| Bug/debito tecnico non urgente | `backlog task create` a bassa priorita' in Backlog |
| Comportamento rotto rispetto a prima (regressione) | `backlog task create` alta priorita' `[regression]` in To Do + nota ADR |
| Serve una decisione esplicita dell'utente (tradeoff prodotto/sicurezza) | `backlog task create` in Open Points |
| Dipendenza bloccante mancante | `backlog task create` alta priorita' in To Do |

Prima di creare un task, esegui `backlog task list` e deduplica: se esiste
gia' un task che copre la stessa causa (es. TASK-132 per il caso Party Room),
non crearne uno nuovo - riusa quello e basta, e lascialo linkato nel riepilogo
finale.

## 5. Riepilogo finale

Non deployare, non fare commit/push da questa skill (non tocca codice
prodotto). Al termine produci un riepilogo leggibile:

- quanti gruppi trovati in totale, quante occorrenze totali;
- per ogni gruppo eliminato: `(statusCode, pathSignature)`, quante righe
  eliminate, motivo in una frase;
- per ogni gruppo lasciato: `(statusCode, pathSignature)`, quante righe,
  motivo per cui resta, e il task Backlog.md collegato (nuovo o esistente) se
  applicabile;
- se e' stato creato o riusato un task, elenca l'ID.
