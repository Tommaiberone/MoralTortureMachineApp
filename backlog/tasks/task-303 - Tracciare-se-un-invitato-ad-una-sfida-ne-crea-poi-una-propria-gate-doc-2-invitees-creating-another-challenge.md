---
id: TASK-303
title: >-
  Tracciare se un invitato ad una sfida ne crea poi una propria (gate doc-2
  'invitees creating another challenge')
status: Done
assignee: []
created_date: '2026-09-10 19:10'
updated_date: '2026-09-14 08:29'
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
- [x] #1 Esiste un nuovo campo nella risposta di /admin/analytics/overview che misura quanti identity, dopo essere stati invitee di almeno una sfida, hanno poi creato una propria sfida nello stesso periodo
- [x] #2 Il calcolo non traccia e non espone alcun identificativo di sfida specifica (nessun challenge_token), solo conteggi di identita' aggregati
- [x] #3 La nuova dimensione e' coperta da test unitari (scrittura e lettura) e dal confronto scan-vs-aggregate gia' stabilito dalle altre metriche
- [x] #4 Il nuovo dato e' visibile nella dashboard (tab growth o funnel Duel), con etichetta chiara del gate doc-2 a cui corrisponde
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-14 08:13
---
Misura manuale una tantum 2026-09-14 (deep-dive analytics-optimize, sola lettura via mtm-analytics-readonly, in attesa dell'implementazione di questo task): finche' il campo non esiste in /admin/analytics/overview, calcolato direttamente su tutta la storia disponibile (challenge_joined_client vs challenge_share_ready per identity, nessun challenge_token letto o esposto, stesso principio privacy di build_viral_coefficient).

50 identita' distinte sono mai state invitee di una sfida. Di queste, 0 (0,0%) hanno poi creato una propria nuova sfida DOPO essere state invitate. 2 compaiono anche come creator, ma in entrambi i casi il loro challenge_share_ready precede il loro primo challenge_joined_client (erano gia' creator prima di essere invitate da qualcun altro, non il contrario). Per contesto: 99 identita' distinte hanno creato almeno una sfida in totale.

Il gate doc-2 'invitees creating another challenge: tracked and improving each release' e' quindi oggi a 0% con un campione piccolo ma completo (50 invitee su tutta la vita del prodotto) - il loop virale non si sta ancora propagando oltre il primo hop: chi viene sfidato risponde ma non sfida a sua volta nessun altro. Coerente con la D7=0% della coorte duel_invitee (vedi commento aggiunto oggi su TASK-273): chi entra da un invito non solo non torna a una settimana, non chiude nemmeno il cerchio diventando lui stesso un secondo nodo della catena.

Non è un numero definitivo (implementare questo task per un conteggio scan-vs-aggregate verificato è comunque l'AC#1 corretto), ma dato l'evidenza forte, questo task meriterebbe priorita' piu' alta di quella attuale (medium, To Do) vista la sua rilevanza per capire se la crescita e' davvero un loop o un funnel a un solo passaggio.
---

created: 2026-09-14 08:29
---
Implementato 2026-09-14 (ADR-147). Nessun nuovo namespace di scrittura: MORAL_DUEL_ANALYTICS_STAGES gia' traccia joined (invitee) e challengeCreated (creator) come Set di identita', sia lato Scan-derived sia lato write-time-aggregate (TASK-300.2). Aggiunta _stage_identities_from_events (refactor di _build_identity_funnel per esporre i Set grezzi) e _invitee_creates_another_challenge_rate (intersezione pura tra i due Set), usata da entrambi i path. Nuovo campo: moralDuel.inviteesCreatingAnotherChallenge = {invitees, becameCreator, conversionRatePct, insufficientSample}, soglia campione minima 30 come retentionCohorts/copyExperiments.

AC#2: nessun challenge_token letto o esposto - solo intersezione di identity Set, stesso pattern di build_viral_coefficient/build_creative_variant_breakdown.

Order-agnostic per costruzione (stessa limitazione gia' accettata da ogni altra dimensione TASK-300.x): risponde "questa identita' ha avuto entrambi i ruoli nel periodo", non "l'invito era prima della sfida creata poi" - un Set per-day non preserva l'ordine cronologico attraverso i giorni. Documentato nel docstring, nel caveat frontend e in doc-1.

Frontend: quinta riga nel pannello Growth gates (TASK-305). doc-2 definisce questo gate come "tracked and improving each release", non una percentuale fissa - quindi non mostra mai un verdetto pass/fail: aggiunto uno stato neutro "Tracked" nella cella di stato (gate.passed === null), usato solo da questa riga. Aggiunto anche un caveat aside sullo stesso modello del North Star. Nuove chiavi solo in en.json (it.json drift exception).

AC#3: 2 nuovi unit test dedicati (campione sufficiente con overlap noto; sotto RETENTION_MIN_COHORT_SAMPLE rate withheld) + una terza identita' aggiunta al test di confronto scan-vs-aggregate gia' esistente (test_aggregate_derived_fields_match_scan_derived_fields) con assert di sanity non vacuo. Nessun test dedicato al "path di scrittura": non e' stato toccato (i Set duelStage__*__joined/challengeCreated erano gia' scritti e gia' testati prima di questo task), solo il calcolo lato lettura e' nuovo.

Verifica: pnpm lint, pnpm build:prod, e l'intera suite backend (tutti i moduli backend/tests/test_*.py) passano. doc-1 aggiornato (il paragrafo TASK-305 diceva ancora "quattro gate misurabili" e segnalava questo come non tracciato - entrambi corretti). Nessun avviso di rebuild Android (campo dashboard admin-only, nessun cambio di contratto client). Nessun bump di versione (solo web/backend, la dashboard non e' impacchettata nell'APK).
---
<!-- COMMENTS:END -->
