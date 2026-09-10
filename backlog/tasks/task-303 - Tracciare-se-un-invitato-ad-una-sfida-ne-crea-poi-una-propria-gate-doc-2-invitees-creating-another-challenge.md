---
id: TASK-303
title: >-
  Tracciare se un invitato ad una sfida ne crea poi una propria (gate doc-2
  'invitees creating another challenge')
status: To Do
assignee: []
created_date: '2026-09-10 19:10'
labels: []
dependencies: []
priority: medium
type: feature
ordinal: 204000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
doc-2 (Validation gates) elenca esplicitamente 'Invitees creating another challenge: tracked and improving each release' come uno dei gate di crescita iniziali - ma oggi non esiste alcuna metrica che lo misuri nella dashboard/analytics. E' l'unico dei 5 gate elencati in doc-2 completamente non tracciato (gli altri 4 sono gia' derivabili da funnel/retentionCohorts esistenti, vedi TASK-303 per l'esposizione in dashboard).

Serve una nuova dimensione: per ogni identity che e' stata invitee di una sfida (challenge_joined_client), verificare se ha POI creato una propria sfida come creator (challenge_share_ready generato per un profilo di cui e' proprietaria, non come parte del rispondere a un invito). Questo e' concettualmente lo stesso pattern gia' costruito in TASK-300.2 (Set di identita' per-giorno) - probabilmente serve un nuovo Set 'duelInviteeIdentities' (chi ha fatto joined) e un nuovo Set 'duelCreatorIdentities' (chi ha fatto challenge_share_ready), poi calcolare l'intersezione/sequenza temporale (invitee-poi-creator) lato build_analytics_overview o in un nuovo campo simile a copyExperiments.

Attenzione alla privacy: non serve e non va tracciato l'ID della sfida specifica (challenge_token resta escluso da TASK-200/ADR), solo l'identita' e il suo ruolo (creator vs invitee) nel tempo - stesso principio gia' rispettato da build_viral_coefficient/build_creative_variant_breakdown.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Esiste un nuovo campo nella risposta di /admin/analytics/overview che misura quanti identity, dopo essere stati invitee di almeno una sfida, hanno poi creato una propria sfida nello stesso periodo
- [ ] #2 Il calcolo non traccia e non espone alcun identificativo di sfida specifica (nessun challenge_token), solo conteggi di identita' aggregati
- [ ] #3 La nuova dimensione e' coperta da test unitari (scrittura e lettura) e dal confronto scan-vs-aggregate gia' stabilito dalle altre metriche
- [ ] #4 Il nuovo dato e' visibile nella dashboard (tab growth o funnel Duel), con etichetta chiara del gate doc-2 a cui corrisponde
<!-- AC:END -->
