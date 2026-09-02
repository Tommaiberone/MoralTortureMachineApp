---
id: TASK-198
title: >-
  Identify the field causing recurring 422 validation rejections on POST
  /analytics/events
status: Done
assignee: []
created_date: '2026-08-24 15:38'
updated_date: '2026-09-02 12:39'
labels:
  - bug
  - frontend
  - backend
  - analytics
dependencies: []
priority: low
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-174 (Done) stopped the client from retrying/blocking its queue on a 422, but did not identify why individual batches fail AnalyticsEvent schema validation (backend_fastapi.py:1065) in the first place. Found while sweeping prod-moral-torture-machine-ops-error-alerts (ops-alerts-sweep/TASK-130): 67 more (422, /analytics/events) alert rows accumulated *after* TASK-174's fix shipped (2026-08-10), spread steadily at roughly 2-13/day through 2026-08-24 with no clear growth or decay trend - not a retry storm (that pattern is confirmed fixed), but a real, sustained baseline of individual events being permanently dropped. The exact failing field cannot be read from CloudWatch today since the request body is intentionally never logged (privacy policy) per TASK-174's own investigation. Candidate schema constraints worth checking first: eventName's strict pattern (^[a-z][a-z0-9_]+$), eventId's UUID v4-shaped pattern, occurredAt's bounded epoch-millis range, the utm dict's allowed-key allowlist, or a stale app_version/client sending a shape an older schemaVersion no longer accepts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A privacy-safe way to identify which field(s) actually fail validation is implemented or proposed (e.g. logging only the Pydantic error type/field path, never the value or full body)
- [x] #2 Root cause of at least the dominant failure mode is identified from real data
- [x] #3 Decision recorded on whether the identified cause warrants a client-side or schema fix, or is accepted as expected loss
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Risolto 2026-09-02 durante /ops-alerts-sweep, usando il nuovo profilo read-only mtm-ops-readonly (ADR-102) per leggere CloudWatch Logs - non era possibile prima (TASK-224 non era ancora risolto). Aggregati tutti i log 'Validation error on ...' dal deploy del logging (2026-08-25 11:20 UTC, commit 3595e55) a oggi: 78 righe, 113 (loc, type) totali su piu' eventi per batch. Causa dominante (AC#2): campo 'referrer', type 'value_error' - 90/113 occorrenze (~80%). Causa secondaria: campo 'timeZone', type 'string_pattern_mismatch' - 23/113 (~20%). Per 'referrer': il frontend (analytics.js getAttribution) gia' estrae solo new URL(document.referrer).origin prima di inviarlo, quindi in un browser desktop/web normale il valore dovrebbe gia' rispettare il validator backend (solo scheme http/https, nessun path/query/params/fragment/credenziali). L'ipotesi piu' plausibile e' un document.referrer con scheme non-http(s) (es. un referrer di tipo app/intent) osservato nel contesto Android WebView - lo scheme verrebbe scartato subito dal validator (parsed.scheme not in {'http','https'}). Per 'timeZone': il pattern ^[A-Za-z0-9_+/-]+$ non ammette ':' - alcuni WebView/versioni Android piu' vecchie possono restituire un fuso orario in stile offset (es. 'GMT+03:00') invece di un nome IANA. In nessun caso il valore rifiutato e' leggibile dai log (mai loggato per privacy, come da design AC#1) - l'ipotesi resta la spiegazione piu' plausibile dal codice, non confermata byte-per-byte. Decisione (AC#3): la causa giustifica un fix lato schema, non e' una perdita accettata - referrer e timeZone sono dati di attribuzione opzionali e a bassa importanza, ma oggi un singolo valore malformato in un evento fa fallire la validazione dell'INTERO batch Pydantic (fino a 25 eventi), scartandone anche di validi. Il fix corretto e' rendere questi due campi 'fail-soft' (normalizzati a None se non validi invece di rigettare l'intera richiesta), non rigettarli. Aperto TASK-230 in To Do per l'implementazione (fuori dal mandato di sola lettura di /ops-alerts-sweep). Le 133 righe (422, /analytics/events) restano nella tabella ops_error_alerts: la causa e' identificata ma non ancora corretta in codice, quindi non soddisfa il criterio di eliminazione dello sweep.
<!-- SECTION:NOTES:END -->
