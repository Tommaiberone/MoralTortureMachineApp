---
id: TASK-274
title: >-
  Notifiche push: fondamenta backend condivise (subscription store, invio,
  metriche privacy-safe)
status: Done
assignee: []
created_date: '2026-09-07 08:28'
updated_date: '2026-09-07 08:55'
labels:
  - growth
  - retention
  - notifications
  - backend
dependencies: []
references:
  - backlog/decisions/decision-1 - ADR-Log.md
documentation:
  - backlog/docs/doc-2
priority: high
type: feature
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fondamenta condivise per i due canali di notifica push (TASK-45 nativo Android/FCM e la nuova card Web Push/PWA): entrambi devono salvare una subscription per identita' e ricevere un invio, quindi lo schema/endpoint vanno costruiti una volta sola invece che duplicati (CLAUDE.md, riuso su duplicazione). Nasce dalla diagnosi TASK-273: il loop Moral Duel ha D1 alto (11,4%) ma D7 a zero (0/93) - la gente torna se sa che qualcuno la aspetta, ma smette perche' nessuno glielo ricorda; le notifiche transazionali sono la leva piu' diretta trovata finora.

Ambito di questa card: solo l'infrastruttura di invio, nessuna UI e nessun trigger applicativo specifico (quelli sono nella card Web Push e in TASK-45).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuova tabella DynamoDB per le subscription, con un campo channel ('web_push' | 'fcm') cosi' lo stesso record model serve entrambi i canali; deletion_protection coerente con TASK-253, TTL sulle subscription scadute/invalidate
- [x] #2 Endpoint autenticato via anonymous_user_id (coerente col resto del prodotto) per subscribe/unsubscribe, idempotente
- [x] #3 Funzione di invio generica lato backend (channel-agnostic verso il chiamante: web push firmato VAPID per 'web_push', Firebase Admin SDK per 'fcm'), pensata per essere invocata da eventi transazionali specifici (es. duel risposto), non da un job broadcast
- [x] #4 Eventi analytics privacy-safe versionati e snake_case per delivery/open/click/opt-out, nessun token/subscription grezzo nelle property
- [x] #5 Verifica esplicita Free Tier prima di provisionare: nuova tabella nel pattern on-demand/provisioned condiviso gia' in uso, nessun costo diretto di invio (Web Push e' gratuito lato browser vendor, FCM e' gratuito per messaging)
- [x] #6 Unit test backend; pnpm lint e pnpm build:prod non si applicano (nessun cambio frontend in questa card)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato 2026-09-07 (ADR-123). Tabella push_subscriptions (PK anonymousUserId, SK subscriptionId, campo channel), endpoint POST /push/subscribe|/push/unsubscribe (idempotenti, X-Anonymous-User-Id), GET /push/vapid-public-key (pubblico), funzione generica send_push_notification(request, anonymous_user_id, title, body, data) - non ancora chiamata da nessun trigger applicativo (fuori scope di questo task), pronta per TASK-275/TASK-45.

AC#3 - sostituzione dichiarata: 'Firebase Admin SDK' sostituito con l'API diretta HTTP v1 di Google (JWT service-account firmato con PyJWT gia' presente + scambio OAuth2), per evitare la dipendenza pesante. Per web_push: py-vapid + http-ece al posto di pywebpush (che forza aiohttp come dipendenza obbligatoria). Vedi ADR-123 per il ragionamento completo e la verifica del roundtrip di cifratura aes128gcm.

AC#4 - durante la verifica ho notato che gli endpoint subscribe/unsubscribe non tracciavano ancora l'opt-in/opt-out lato server: aggiunti push_subscribed/push_unsubscribed via _track_duel_event (stesso meccanismo gia' esistente), oltre a push_delivery_succeeded/push_delivery_failed gia' previsti. open/click restano client-side, di competenza di TASK-275/TASK-45.

Per attivare davvero l'invio web_push in prod serve generare una chiave VAPID reale e crearla come GitHub secret VAPID_PRIVATE_KEY (il workflow la scrive su SSM automaticamente al prossimo deploy se il secret esiste, altrimenti lo step viene saltato senza errori):
python -c "from py_vapid import Vapid02 as Vapid; from py_vapid.utils import b64urlencode, num_to_bytes; v = Vapid(); v.generate_keys(); print(b64urlencode(num_to_bytes(v.private_key.private_numbers().private_value, 32)))"
(richiede py-vapid installato: pip install py-vapid). Finche' il secret non esiste, get_vapid_private_key() risponde 503 in modo esplicito invece di fallire silenziosamente.

Verifica: terraform validate pulito (isolato dal backend S3 reale, .terraform temporaneamente spostato e ripristinato, nessuna credenziale root usata); 219/219 test backend passano (16 nuovi + 203 esistenti); py_compile pulito. Nessun terraform apply eseguito; nessuna modifica frontend/Android, quindi nessun rebuild APK necessario per questo task.
<!-- SECTION:NOTES:END -->
