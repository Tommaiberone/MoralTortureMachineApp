---
id: TASK-129
title: Persistere gli alert operativi 4xx/5xx su DynamoDB
status: Done
assignee: []
created_date: '2026-08-04 07:28'
updated_date: '2026-08-04 07:35'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Oltre alla mail SNS gia' esistente (TASK-104), ogni alert inviato deve essere scritto anche in una nuova tabella DynamoDB, cosi' e' piu' facile ritrovarli e analizzarli in batch (TASK-130). In questo lavoro va anche normalizzato il segnale di coalescing/raggruppamento a livello di route template (es. /party-rooms/{room_code}) invece che di path letterale, perche' oggi ogni istanza di risorsa diversa (room/profilo/challenge diversi) genera una mail/riga separata, vanificando il coalescing pensato in ADR-045.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ogni alert inviato via SNS (stesso trigger di _notify_ops_of_error) scrive anche un item nella nuova tabella ops_error_alerts (status code, method, path letterale, route signature, detail, timestamp), best-effort e senza mai rompere la risposta HTTP
- [ ] #2 Il cooldown di coalescing usa il route template quando disponibile (es. /party-rooms/{room_code}) invece del path letterale, cosi' richieste sulla stessa route con parametri diversi non generano una mail/riga indipendente ciascuna
- [ ] #3 Nuova tabella Terraform PROVISIONED 1/1 con TTL, IAM least-privilege coerente col pattern esistente, nessun nuovo costo variabile
- [ ] #4 Unit test aggiornati/aggiunti per la nuova firma di raggruppamento e per la scrittura DynamoDB (incluso il caso di fallimento silenzioso)
- [ ] #5 doc-1 e ADR log aggiornati
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunta tabella DynamoDB ops_error_alerts (provisioned 1/1, TTL 30gg) scritta da _record_ops_error_alert ogni volta che notify_ops_of_errors invierebbe la mail SNS (stesso cooldown, ma disaccoppiata dal flag email). Corretta anche la chiave di coalescing (ADR-045 coalescava per path letterale, che su route parametriche tipo /party-rooms/{code} non coalesca quasi nulla): _request_path_signature usa ora il route template quando disponibile, o per i 429 del burst guard (che non arrivano mai al router) il nome della regola (rate_limit:party_room_poll ecc). Aggiunta anche GET /robots.txt (200 disallow-all) che risolve TASK-131 alla radice. Terraform validato, IAM aggiornato, env var wired. 14 test nuovi/aggiornati in test_ops_error_notifications.py, intera suite backend (127 test) verde. Vedi ADR-059/060.
<!-- SECTION:FINAL_SUMMARY:END -->
