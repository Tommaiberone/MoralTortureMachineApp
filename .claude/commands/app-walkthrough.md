---
description: App walkthrough (TASK-190) - giro completo dell'app per trovare parti acerbe/rough edges non ancora tracciate, e instradarle nel Backlog secondo le regole di CLAUDE.md
---

# App walkthrough

Trigger: l'utente chiede un "giro completo dell'app", di controllare "cosa c'e'
di acerbo/rough/non finito", o invoca `/app-walkthrough`. Implementa TASK-190:
una sweep di sola lettura su frontend e backend che trova problemi non ancora
tracciati e li instrada nel Backlog secondo CLAUDE.md - non li implementa.
Segue e non sostituisce `CLAUDE.md` (protocollo pre/post-task, routing dei
nuovi problemi, vincoli di prodotto/costo/sicurezza restano validi). Simile
nello spirito a `ops-alerts-sweep.md` (trova e instrada, non modifica codice)
ma sull'intera codebase invece che sulla tabella `ops_error_alerts`.

## 1. Preflight: cosa e' gia' noto

Prima di cercare qualunque cosa, esegui `backlog task list` (tutte le
colonne) e tienine il risultato a portata di mano per l'intera esecuzione.
Se l'utente ha appena chiuso un audit o un redesign in questa stessa
sessione (es. un nuovo screen, un nuovo endpoint), nota esplicitamente quali
file sono stati appena toccati: vanno comunque controllati (una seconda
revisione e' utile), ma un problema trovato li' e' "appena introdotto", non
"debito storico" - la distinzione conta per il routing al punto 4.

## 2. Ricerca in parallelo, non sequenziale

Lancia almeno due agenti general-purpose in parallelo (non Explore: qui
serve giudizio/analisi, non solo localizzare file), tipicamente uno per il
frontend e uno per il backend - aggiungine altri se l'app ha altre aree
grandi e distinte (es. infrastruttura/Terraform, script di dati). Ogni
prompt deve includere, sempre:

- l'elenco concreto di cio' che e' *gia'* tracciato in Backlog.md (dal punto
  1), cosi' l'agente non ri-scopre cose note - passa gli ID e una frase di
  descrizione per ciascuno, non solo "controlla il backlog";
- l'istruzione esplicita che e' ricerca pura: leggere codice, non scrivere
  o modificare nulla, riportare solo fatti verificati con riferimento
  `file:riga`, mai speculazioni;
- un budget di scope ("leggi ogni screen/ogni endpoint", non un campione) e
  un limite di lunghezza per la risposta finale, per restare gestibile;
- le categorie da cercare (adatta liberamente, ma queste hanno gia' trovato
  problemi reali in esecuzioni precedenti):
  1. Commenti TODO/FIXME/XXX o "coming soon" ancora nel codice di produzione.
  2. `console.log`/print di debug non gated (mai `console.error`/log di
     errori reali, quelli sono la convenzione consolidata).
  3. Codice morto: blocchi commentati, import inutilizzati, funzioni/file
     mai referenziati altrove (verifica sempre se e' referenziato da un
     commento che spiega un motivo - es. una feature temporaneamente
     disattivata per una exception documentata in `CLAUDE.md` - prima di
     considerarlo dead code ordinario, vedi punto 4).
  4. Feature a meta': uno stato o handler dichiarato ma mai collegato alla
     UI, un pulsante il cui handler e' un no-op.
  5. Navigazione rotta o incoerente: link/bottoni verso route inesistenti,
     route duplicate o in conflitto, assenza di una route "catch-all"/404.
  6. Copy incoerente: stringhe hardcoded dove il resto della codebase passa
     da un sistema di i18n/localizzazione, o testo ormai stantio rispetto a
     una modifica di prodotto recente (es. un numero fisso citato nel testo
     quando il comportamento e' diventato variabile).
  7. Uno screen/componente/endpoint visibilmente meno completo dei suoi
     simili (manca uno stato di loading/errore/vuoto che i suoi fratelli
     hanno).
  8. Solo per il backend: gestione errori incoerente tra endpoint simili
     (alcuni fanno leak del testo grezzo dell'eccezione, altri no; alcuni
     validano l'input, altri no), valori hardcoded duplicati che dovrebbero
     essere una costante nominata, endpoint senza alcun test diretto,
     drift rispetto a quanto documentato in `backlog/docs/doc-1`, risorse
     Terraform con permessi IAM incompleti per cio' che il codice applicativo
     interroga davvero (es. un indice GSI nuovo senza il corrispondente
     `/index/*` nella policy IAM della Lambda).

## 3. Triage e dedup, prima di creare qualunque task

Per ogni finding riportato dagli agenti:

- verifica se un task esistente (dal punto 1) copre gia' la stessa causa -
  se si', arricchiscilo con i dettagli concreti trovati (es. la lista esatta
  di endpoint) invece di creare un duplicato, come si farebbe con la stessa
  logica di dedup di `ops-alerts-sweep`;
- se il finding riguarda codice che sembra "morto" ma e' in realta'
  scaffolding intenzionale per una feature temporaneamente disattivata (una
  exception documentata in `CLAUDE.md`, o un task Backlog esistente che
  pianifica di riattivarla/riusarla), non trattarlo come debito ordinario:
  serve una decisione esplicita (vedi tabella al punto 4), non una pulizia
  automatica;
- se il finding e' su codice appena scritto in questa stessa sessione
  (vedi punto 1), verifica prima se e' effettivamente gia' risolvibile
  subito (es. un fix a una riga) invece di aprire comunque un task - usa
  giudizio, non instrada tutto meccanicamente.

## 4. Instrada secondo CLAUDE.md

Per ogni finding che sopravvive alla dedup, crea un task con `backlog task
create`, instradato secondo la stessa tabella del resto del progetto:

| Causa | Azione |
|---|---|
| Bug/debito tecnico non urgente | `backlog task create` a bassa priorita' in Backlog |
| Comportamento rotto rispetto a prima (regressione) | `backlog task create` alta priorita' `[regression]` in To Do + nota ADR |
| Serve una decisione esplicita dell'utente (tradeoff prodotto/dati/scaffolding da tenere o rimuovere) | `backlog task create` in Open Points |
| Dipendenza bloccante mancante | `backlog task create` alta priorita' in To Do |
| Problema chiaro, autonomo, verificabile | `backlog task create` in To Do alla priorita' appropriata |

Ogni task deve avere una descrizione con riferimenti `file:riga` concreti
(non solo "in giro per il frontend") e almeno un acceptance criterion
verificabile. Non modificare mai codice, infrastruttura o configurazione
da questa skill: e' una sweep di sola lettura, esattamente come
`ops-alerts-sweep`. Se l'utente chiede poi di risolvere i task trovati, e'
un passo successivo ed esplicito, non implicito in questa skill.

## 5. Riepilogo finale

Non deployare, non fare commit/push da questa skill (non tocca codice
prodotto). Al termine produci un riepilogo leggibile, raggruppato per
instradamento:

- quanti finding totali, quanti nuovi task creati e quanti task esistenti
  arricchiti invece che duplicati (con i loro ID);
- i task che richiedono una decisione dell'utente (Open Points), con la
  domanda concreta da porre - se possibile, ponila subito invece di
  limitarti a segnalarla nel riepilogo;
- gli altri task, raggruppati per instradamento (Backlog bassa priorita',
  To Do, regressione), con una frase di motivo ciascuno.
