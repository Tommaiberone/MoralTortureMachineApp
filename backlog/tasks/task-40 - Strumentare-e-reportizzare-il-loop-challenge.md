---
id: TASK-40
title: Strumentare e reportizzare il loop challenge
status: Done
assignee: []
created_date: '2026-07-29 11:28'
updated_date: '2026-07-31 14:18'
labels:
  - m4-duel
  - analytics
  - growth
dependencies:
  - TASK-6
  - TASK-35
  - TASK-39
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Misurare create, open, join, answer, complete, compare, rematch e nuova challenge per origine e piattaforma.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Open-to-complete è calcolabile per canale e piattaforma
- [x] #2 Invitati che creano una nuova challenge sono misurati
- [x] #3 Eventi retry sono deduplicati
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Eventi lato client (idempotenti via eventId + /analytics/events, platform/appVersion allegati automaticamente da trackEvent): challenge_share_ready, challenge_landing_viewed, challenge_joined_client, challenge_answer_selected, challenge_completed_client, challenge_compare_viewed, challenge_rematch_clicked - tutti taggati con challenge_token per poter ricostruire il funnel open->complete per singola sfida, canale e piattaforma. Eventi lato server (track_analytics_event, stesso pattern gia' usato da ogni altro endpoint esistente: /vote, /get-dilemma, ecc. - tabella legacy, non idempotente, coerente con la convenzione attuale non con la nuova piperia idempotente): profile_created, challenge_created, challenge_opened, challenge_joined, challenge_completed, challenge_compared, challenge_rematch_created, challenge_revoked. Rematch tracciato esplicitamente via rematch_of_token/rematchOfToken per collegare le nuove sfide a quella originale (invitati che creano una nuova sfida sono quindi misurabili).
<!-- SECTION:NOTES:END -->
