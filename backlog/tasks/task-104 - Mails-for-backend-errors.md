---
id: TASK-104
title: Mails for backend errors
status: Done
assignee: []
created_date: '2026-07-31 14:53'
updated_date: '2026-08-01 07:39'
labels: []
dependencies: []
priority: high
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Qualsiasi errore 4xx e 5xx deve triggerare una mail tramite l'sns già configurato
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ogni risposta 4xx e 5xx (incluse eccezioni non gestite) pubblica una notifica sull'SNS topic ops_alerts gia' esistente
- [x] #2 Un fallimento della notifica non puo' mai rompere la risposta HTTP originale
- [x] #3 Notifiche ripetute per lo stesso (status_code, path) sono limitate nel tempo per non intasare la mail dell'owner
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aggiunto middleware notify_ops_of_errors in backend_fastapi.py (registrato dopo il burst guard cosi' osserva anche i suoi 429 e le eccezioni non gestite a valle): ogni risposta >=400 pubblica su aws_sns_topic.ops_alerts (stesso topic di ADR-031, nessun nuovo servizio) via aws sns publish, con throttling per (status_code, path) - un'email ogni OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS (default 600s, configurabile) per evitare di intasare la casella dell'owner durante un burst di errori client ordinari (es. 409 ripetuti in Duel). Aggiunta autorizzazione IAM sns:Publish scoped solo su quel topic e le env var OPS_ALERTS_TOPIC_ARN/OPS_ERROR_NOTIFICATIONS_ENABLED/OPS_ERROR_NOTIFICATION_COOLDOWN_SECONDS in backend/terraform/main.tf+variables.tf. Una notifica fallita e' loggata e ignorata, non solleva mai. 8 nuovi unit test in backend/tests/test_ops_error_notifications.py; l'intera suite backend (79 test) passa. Richiede terraform apply per avere effetto.
<!-- SECTION:FINAL_SUMMARY:END -->
