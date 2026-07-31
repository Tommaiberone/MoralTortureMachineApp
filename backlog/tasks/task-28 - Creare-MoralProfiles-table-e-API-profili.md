---
id: TASK-28
title: Creare MoralProfiles table e API profili
status: Done
assignee: []
created_date: '2026-07-29 11:27'
updated_date: '2026-07-31 14:15'
labels:
  - m3-profiles
  - backend
  - database
  - privacy
dependencies:
  - TASK-13
  - TASK-26
documentation:
  - backlog/docs/doc-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Salvare owner, archetipo, score, percentili, lingua, versione algoritmo, visibilità e policy di scadenza; esporre create e get pubblico.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Public ID è non enumerabile
- [x] #2 La response pubblica esclude attributi privati
- [x] #3 Billing mode segue ADR-011 e TASK-88; TTL e retention sono definite
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tabella moral_profiles (Terraform, PK publicId token da secrets.token_urlsafe(16), GSI OwnerIndex su ownerAnonymousUserId+createdAt per trovare il profilo piu' recente). Provisioned 1/1 nel Free Tier condiviso, NESSUN TTL (decisione esplicita: i profili sono contenuto prodotto persistente e condivisibile, non dato analytics effimero; retention formale resta a TASK-64). POST /profiles (crea da answers gia' risposte, riusa compute_dimension_averages+assign_archetype, mai Groq) e GET /profiles/{publicId} (risposta pubblica esclude ownerAnonymousUserId e dilemmaBaseIds). Test in backend/tests/test_duel.py.
<!-- SECTION:NOTES:END -->
