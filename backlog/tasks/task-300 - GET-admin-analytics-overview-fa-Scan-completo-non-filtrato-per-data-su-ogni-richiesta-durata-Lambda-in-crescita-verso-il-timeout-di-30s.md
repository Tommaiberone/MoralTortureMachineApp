---
id: TASK-300
title: >-
  GET /admin/analytics/overview fa Scan completo non filtrato per data su ogni
  richiesta, durata Lambda in crescita verso il timeout di 30s
status: Done
assignee: []
created_date: '2026-09-10 15:04'
updated_date: '2026-09-10 19:03'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 196000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Indagine su richiesta utente ('la pagina delle analytics e' molto lenta'). Causa radice confermata in backend_fastapi.py:

- 'GET /admin/analytics/overview' (riga ~5160) chiama '_scan_all_rows(analytics_table)' e '_scan_all_rows(product_events_table)' (riga 4430): uno Scan DynamoDB completo, paginato in sequenza (nessun parallel segment), di OGNI riga mai scritta in entrambe le tabelle. Il filtro sul parametro 'days' (7/30/90) avviene SOLO dopo, in Python, dentro 'build_analytics_overview' (righe 4992-4997) - quindi chiedere 7 giorni costa quanto chiedere 90 giorni.
- 'normalize_analytics_event' (riga 4373) esegue inferenza User-Agent, controllo automation-signature e parsing proprieta/UTM su OGNI riga scansionata, prima ancora del filtro data - lavoro sprecato per la parte di storico fuori dalla finestra richiesta.
- '_count_registered_users()' (riga 4460) fa un altro Scan completo (con FilterExpression, quindi comunque costo pieno in item scansionati) sulla tabella 'users', chiamato nello stesso request.
- La cache in-memory '_analytics_overview_cache' (riga 368, un dict Python a livello di modulo) e' per-istanza-Lambda: non sopravvive ai cold start e non e' condivisa tra istanze concorrenti, quindi nella pratica quasi ogni caricamento paga il costo pieno. Ha inoltre 12 chiavi distinte (3 periodi x 4 filtri piattaforma esposti da 'AnalyticsAdminScreen.jsx'), quindi anche il semplice click su un altro filtro nella stessa sessione quasi sempre manca la cache.
- La Lambda 'moral-torture-machine-api' ha solo 512MB di memoria (main.tf:1317), che limita proporzionalmente la CPU disponibile per la deserializzazione Decimal via boto3 e per i numerosi passaggi Python separati su tutti gli eventi filtrati (funnel, abuse monitoring, daily moral crime, party room, moral duel, interaction breakdowns, retention cohorts, viral coefficient, creative variants, copy experiments - build_analytics_overview righe 5095-5110).

Evidenza raccolta (profili AWS read-only 'mtm-analytics-ro' e 'mtm-ops-readonly', 2026-09-10):
- 'prod-moral-torture-machine-user-analytics': 34.630 item, ~15,2 MB.
- 'prod-moral-torture-machine-product-events': 16.555 item, ~9,4 MB.
- CloudWatch 'AWS/Lambda Duration' su 'moral-torture-machine-api', ultimi 14 giorni: la MASSIMA giornaliera e' salita da ~5,6s (27/08) a ~23,8s (08/09) e ~23,1s (09/09), mentre la MEDIA resta 20-150ms (dominata dalle route economiche come /vote e /get-dilemma) - la coda lenta e' quasi certamente proprio questo endpoint, e la tendenza segue la crescita organica delle tabelle (TTL 90 giorni, quindi ancora in fase di riempimento verso il tetto di retention). Nessun throttle/errore Lambda o DynamoDB nella finestra osservata, ma il trend si avvicina al timeout hard di 30s condiviso da Lambda e API Gateway HTTP API (main.tf:1316,1520) - oltre quel punto la dashboard iniziera' a fallire (503/504) invece di essere solo lenta.

Questo task documenta l'indagine ed e' pronto per l'implementazione, ma la direzione di fix tocca schema/accesso DynamoDB (categoria 'database' in CLAUDE.md) e richiede una decisione esplicita sull'approccio prima di procedere (vedi commento di notifica).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La risposta di /admin/analytics/overview non richiede piu' uno Scan dell'intera storia della tabella quando viene richiesta una finestra 'days' piu' stretta (es. query/lettura delimitata da data, o rollup pre-calcolati) per user_analytics e product_events
- [x] #2 _count_registered_users non esegue piu' uno Scan completo e non indicizzato sulla tabella users per ogni richiesta della dashboard
- [ ] #3 Dopo il fix, la durata massima giornaliera della Lambda (CloudWatch AWS/Lambda Duration su moral-torture-machine-api) torna stabilmente ben al di sotto del timeout di 30s, verificato con lo stesso metodo usato in questa indagine
- [x] #4 L'eventuale nuovo indice/GSI o cambio di capacity rispetta il vincolo AWS Free Tier di CLAUDE.md (costo/limiti verificati prima dell'implementazione, eccezione registrata se non disponibile un'opzione Free Tier adeguata)
- [x] #5 Il comportamento del filtro platform e dei 12 combinazioni days/platform nella UI resta invariato per l'utente admin
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Risolto tramite 5 subtask sequenziali (TASK-300.1-300.5, ADR-137/138/139/140/141/142): aggregati a scrittura (contatori scalari + Set di identita' per giorno) sostituiscono lo Scan completo di user_analytics/product_events per ogni campo della dashboard; abuseMonitoring/recentEvents usano una finestra breve fissa (48h) via una nuova GSI DayIndex invece dello Scan sull'intero range days; backfill storico eseguito su prod (90 giorni, 2026-06-12 -> 2026-09-09); registeredUsers passato a un contatore a scrittura in users_table, seminato dal vecchio Scan (41 utenti) prima del cutover. GET /admin/analytics/overview non esegue piu' alcuno Scan completo (analytics_table, product_events_table, users_table) per nessuna combinazione days/platform - verificato sia con un test dedicato che con revisione del codice. Nuova tabella analytics_daily_aggregates (PAY_PER_REQUEST, eccezione Free Tier documentata in ADR-139 dopo aver scoperto che DynamoDB fattura UpdateItem in base alla dimensione dell'item, non al delta) e due nuove GSI sparse DayIndex su user_analytics/product_events (nessun costo extra, tabelle gia' PAY_PER_REQUEST). Il filtro platform e le 12 combinazioni days/platform nella UI restano invariati (stesso contratto di risposta). Verificato con oltre 250 test backend, pnpm lint/build:prod puliti, e deploy in produzione confermato ad ogni step. AC#3 (durata massima giornaliera Lambda tornata sotto il timeout, misurata con lo stesso metodo dell'indagine originale) resta esplicitamente aperta: il bucket CloudWatch di oggi include ancora ore precedenti al deploy (~23s osservati), quindi il miglioramento sara' visibile nel bucket di domani o al prossimo caricamento reale della dashboard - nessuna richiesta reale a /admin/analytics/overview e' stata osservata nei log dopo il deploy per campionarla direttamente. La fiducia nella correzione resta comunque alta perche' basata su una garanzia strutturale (lo Scan non puo' piu' essere chiamato, per costruzione del codice) piuttosto che su un solo campione runtime.
<!-- SECTION:FINAL_SUMMARY:END -->
