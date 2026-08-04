---
id: TASK-135
title: Insight AI di coppia sbloccato con login sul confronto Duel
status: Done
assignee: []
created_date: '2026-08-04 09:39'
updated_date: '2026-08-04 10:56'
labels:
  - m4-duel
  - auth
  - growth
  - backend
  - frontend
dependencies:
  - TASK-37
  - TASK-5
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Il gancio 'salva il confronto per sempre' e' un beneficio astratto e differito, poco convincente. Alternativa: un breve testo AI generato una tantum (stesso pattern di _generate_party_group_verdict, cache-on-record, fallback deterministico se Groq non disponibile) che interpreta il pattern di compatibilita' tra i due archetipi, sbloccato solo se l'utente e' autenticato (require_authenticated_user). L'input del prompt e' SOLO nomi archetipi + percentuali aggregate (overallAgreementPct, perDimension, mostAligned/mostDivergentDimension) - MAI risposte o scelte grezze ai singoli dilemmi, per restare coerente con TASK-39 AC3 e con la regola CLAUDE.md di non esporre answer details tramite API. Le statistiche aggregate gia' visibili restano gratuite per tutti (non toccare il completamento attuale); si sblocca solo l'insight testuale in piu'. Sostituisce l'idea di gate sulle risposte dilemma-per-dilemma, scartata perche' in conflitto diretto con TASK-39.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nuovo endpoint autenticato (o parametro su /challenges/{token}/compare con get_optional_user) genera/ritorna l'insight solo per utenti loggati
- [x] #2 L'insight e' generato una sola volta e cachato sul record della challenge, mai rigenerato ad ogni poll/vista
- [x] #3 Esiste un fallback deterministico non-AI quando Groq non e' disponibile
- [x] #4 L'input al prompt usa solo nomi archetipi e percentuali aggregate, mai risposte o scelte ai singoli dilemmi
- [x] #5 Utente anonimo vede un CTA di login con copy legata a questo sblocco specifico, non un generico 'accedi'
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementato: _generate_duel_pair_insight/_fallback_duel_pair_insight in backend_fastapi.py (stesso pattern di _generate_party_group_verdict: generato una volta, cachato su challenges_table via update_item con ConditionExpression attribute_not_exists(pairInsight), fallback deterministico se Groq assente). GET /challenges/{token}/compare usa get_optional_user: se autenticato ritorna pairInsight + pairInsightUnlocked=true, altrimenti solo pairInsightUnlocked=false (comparazione aggregata resta gratuita per tutti). Input al prompt: solo nomi archetipi + percentuali aggregate, mai risposte ai dilemmi (coerente con TASK-39). Frontend: ChallengeCompareScreen.jsx mostra l'insight o una CTA di login contestuale (auth.login), con eventi auth_prompt_shown/auth_prompt_clicked. Nuovi test in test_duel.py (pair insight unlocked/cached/non-rigenerato). 133 test backend passano.
<!-- SECTION:NOTES:END -->
