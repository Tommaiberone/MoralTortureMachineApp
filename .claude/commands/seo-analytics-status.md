---
description: SEO & analytics status (TASK-195) - report read-only sullo stato di SEO organico, Growth Intelligence/ASO e dashboard analytics, letto da Backlog.md, doc-1/doc-2, codice e dall'ultimo run reale del workflow growth-intelligence.yml
---

# SEO & analytics status

Trigger: l'utente chiede "a che punto siamo con SEO/analytics", un'analisi
SEO/analytics, lo stato della crescita organica, o invoca
`/seo-analytics-status`. Implementa TASK-195: un report read-only che
fotografa lo stato reale (non solo quello dichiarato in Backlog.md) di SEO
non-brand, automazione Growth Intelligence, ASO e dashboard analytics. Segue
e non sostituisce `CLAUDE.md` (protocollo pre/post-task, routing dei nuovi
problemi, vincoli di prodotto/costo/sicurezza restano validi). Stesso
principio di sola lettura di `ops-alerts-sweep.md`/`app-walkthrough.md`:
fotografa e instrada, non modifica codice ne' pubblica nulla.

## 1. Preflight: cosa dice Backlog.md

Esegui `backlog task list --plain` (tutte le colonne) e filtra/tieni a
portata di mano ogni task o subtask con label `seo`, `aso`, `analytics` o
`growth` - non fare affidamento su ID di task citati in run precedenti di
questa skill, la numerazione evolve. Per ciascuno leggi lo stato reale con
`backlog task TASK-N --plain`, non solo il titolo: un task puo' apparire
`Done` con un acceptance criterion esplicitamente lasciato non spuntato (vedi
il caso TASK-97 → AC "consenso/privacy verso GA4" storicamente aperto pur con
le landing gia' pubblicate), o essere `Blocked` da un'azione manuale del
proprietario piuttosto che da lavoro di codice mancante (vedi il caso TASK-63
→ Data Safety Play Console, TASK-98 → permesso Play Console read-only). Nota
esplicitamente la differenza fra "blocco tecnico" e "blocco su azione
esterna del proprietario": cambia cosa consigliare come prossimo passo.

Leggi anche `backlog doc view doc-2` (validation gate: completion, share
rate, challenge open-to-complete, D7 retention, conversione pack) e le
sezioni "Analytics contract" e "Organic discovery architecture" di
`backlog doc view doc-1`, per sapere cosa e' *dichiarato* come implementato
prima di verificarlo nel codice/nei dati reali al passo successivo.

## 2. Verifica nel codice, non solo nei task

Non fidarti di uno stato `Done` senza un riscontro concreto:

- `frontend/public/sitemap.xml` e `frontend/public/robots.txt`: contano le
  landing SEO effettivamente elencate (hreflang reciproci EN/IT) e
  confrontale con `frontend/src/content/seoLandings.js` - un disallineamento
  fra le due e' un finding, non solo una nota.
- Consenso/tag GA4: cerca dove il tag viene caricato solo dopo consenso
  (grep per `result_viewed`, `mtm_web_analytics_consent`) per confermare che
  l'implementazione descritta in doc-1 esiste davvero nel codice corrente.
- Dashboard analytics: se rilevante alla domanda dell'utente, apri
  `frontend/src/screens/AnalyticsAdminScreen.jsx` per lo stato attuale
  (struttura a tab, KPI band) invece di fidarti della descrizione in doc-1,
  che puo' essere stata scritta prima dell'ultima iterazione.

## 3. L'ultimo run reale di Growth Intelligence

Il report Backlog.md/doc-1 descrive l'*architettura*; i numeri reali vanno
letti dal run schedulato piu' recente:

```bash
gh run list --workflow=growth-intelligence.yml --limit 5
gh run download <run-id> -D <scratchpad>/gi_latest
```

Usa la directory scratchpad di sessione, non la working tree del repo.
Dal `growth-intelligence-report.json` scaricato estrai, con `Read`/`Grep`
(niente assunzione che `python`/`python3` sia disponibile nella shell -
verificato non esserlo in questo ambiente Windows; usa `Grep`/`Read` diretti
sul JSON):

- `search_console.aggregated_rows`: quota di click/impression sulla query
  brand (da `configuration.brand_terms`) contro tutto il resto - se il resto
  e' quasi zero o e' confusione con un concorrente/prodotto omonimo (com'era
  il caso reale del 2026-08-10: "dilemmo"/"moral machine"), dillo
  esplicitamente, non arrotondare a "sta andando bene".
- `ga4.rows`: vuoto significa zero conversioni organiche osservate finora,
  non un errore di implementazione se il tag/consenso sono confermati al
  passo 2.
- `pagespeed`: segnala qualunque pagina con `performance` sotto ~80 come
  outlier da controllare, sulle altre limitati a confermare che sono in
  buono stato.
- `demand_radar.candidates`: `evidence` puo' essere `directional`
  (autocomplete, nessun volume), `observed` (compare anche in Search
  Console) o `quantified` (volume reale da CSV Keyword Planner) - riporta
  quanti candidati sono in ciascuna classe, mai come "domanda validata" se
  sono tutti `directional`.
- `play.acquisition_rows`/`play.vitals`/`configuration.errors`: se vuoti o
  in errore, l'ASO e' bloccato sui permessi Play Console, non su un bug.

Se non esiste un run recente (workflow mai eseguito o fallito da settimane),
segnalalo come primo finding: la pipeline di misura stessa e' degradata.

## 4. Instrada cio' che non e' ancora tracciato

Se durante l'analisi emerge un problema non gia' coperto da un task esistente
(es. un disallineamento sitemap/codice, un run del workflow fallito senza
task collegato, un blocco esterno mai registrato come Open Point), instradalo
secondo la stessa tabella di `CLAUDE.md`/`ops-alerts-sweep.md`:

| Causa | Azione |
|---|---|
| Bug/debito tecnico non urgente | `backlog task create` a bassa priorita' in Backlog |
| Comportamento rotto rispetto a prima (regressione) | `backlog task create` alta priorita' `[regression]` in To Do + nota ADR |
| Serve una decisione/azione esplicita del proprietario | `backlog task create` in Open Points |
| Dipendenza bloccante mancante | `backlog task create` alta priorita' in To Do |

Deduplica sempre contro il punto 1 prima di creare un task. Questa skill
resta di sola lettura sul prodotto: non modifica codice, non fa deploy, non
pubblica contenuti/listing. La creazione di task Backlog.md e' l'unica
scrittura ammessa.

## 5. Riepilogo finale

Produci un report strutturato, non un semplice elenco di stati Backlog.md,
con queste sezioni:

1. **SEO live e verificato** - cosa e' effettivamente in produzione e
   confermato (landing, sitemap/robots, structured data, PageSpeed).
2. **Segnale reale dal traffico** - split brand/non-brand da Search Console,
   con l'avvertenza esplicita se il campione e' troppo piccolo per essere un
   trend (doc-2: confronti settimanali escludono query brand e richiedono
   campione significativo).
3. **Automazione (Growth Intelligence/demand radar/ASO)** - salute del
   workflow, classe di evidenza del demand radar, stato ASO.
4. **Analytics (pipeline/dashboard)** - maturita' della dashboard, bug noti
   aperti vs. gia' risolti.
5. **Blocchi esterni che richiedono un'azione del proprietario** - elencati
   per nome (es. dichiarazione Data Safety in Play Console, permesso Play
   Console read-only al service account, CSV Keyword Planner o approvazione
   Google Ads API), distinti chiaramente da lavoro di implementazione
   ancora da fare.
6. **Prossimi passi consigliati**, in ordine di impatto/sforzo.

Se sono stati creati o arricchiti task al passo 4, elencane gli ID nel
riepilogo.
